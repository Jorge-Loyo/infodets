import uuid
import logging
import threading
from sqlalchemy.orm import Session
from app.models.models import ValidacionRespuesta

logger = logging.getLogger(__name__)

UMBRAL_AUTO = 0.85      # score >= 0.85 → se indexa automáticamente
UMBRAL_REVISION = 0.50  # score >= 0.50 → va a revisión manual


def crear_validacion(db: Session, pregunta: str, respuesta: str, puntaje: float, fuente: str = "usuario") -> ValidacionRespuesta | None:
    if puntaje < UMBRAL_REVISION:
        return None

    if puntaje >= UMBRAL_AUTO:
        # Indexar en thread separado para no bloquear el stream
        threading.Thread(target=_indexar_en_qdrant, args=(pregunta, respuesta), daemon=True).start()
        estado = "auto_indexado"
        logger.info(f"[VALIDACION] Auto-indexado iniciado (score={puntaje:.3f}): {pregunta[:60]}")
    else:
        estado = "pendiente"

    v = ValidacionRespuesta(
        pregunta=pregunta,
        respuesta=respuesta,
        puntaje_confianza=puntaje,
        fuente=fuente,
        estado=estado,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


def listar_validaciones(db: Session, estado: str | None = None) -> list[ValidacionRespuesta]:
    q = db.query(ValidacionRespuesta)
    if estado:
        q = q.filter(ValidacionRespuesta.estado == estado)
    return q.order_by(ValidacionRespuesta.creado_en.desc()).all()


def aprobar(db: Session, validacion_id: str) -> ValidacionRespuesta | None:
    v = db.query(ValidacionRespuesta).filter(ValidacionRespuesta.id == validacion_id).first()
    if not v or v.estado not in ("pendiente",):
        return None
    threading.Thread(target=_indexar_en_qdrant, args=(v.pregunta, v.respuesta), daemon=True).start()
    v.estado = "aprobado"
    db.commit()
    db.refresh(v)
    logger.info(f"[VALIDACION] Aprobado, indexado en background: {v.pregunta[:60]}")
    return v


def rechazar(db: Session, validacion_id: str) -> ValidacionRespuesta | None:
    v = db.query(ValidacionRespuesta).filter(ValidacionRespuesta.id == validacion_id).first()
    if not v:
        return None
    v.estado = "rechazado"
    db.commit()
    db.refresh(v)
    return v


def _indexar_en_qdrant(pregunta: str, respuesta: str):
    try:
        from app.services.embedding_service import generate_embedding
        from app.services.qdrant_service import upsert
        from qdrant_client.models import PointStruct
        texto = f"Pregunta: {pregunta}\nRespuesta: {respuesta}"
        vector = generate_embedding(texto)
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": texto,
                "document_id": "validacion_ia",
                "source_url": "",
                "titulo": f"Consulta validada: {pregunta[:60]}",
                "page_number": 0,
            },
        )
        upsert([point])
        logger.info(f"[VALIDACION] Indexado en Qdrant: {pregunta[:60]}")
    except Exception as e:
        logger.error(f"[VALIDACION] Error al indexar en Qdrant: {e}")
