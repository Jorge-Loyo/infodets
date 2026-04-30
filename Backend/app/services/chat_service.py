import uuid
import logging
from app.core.database import SessionLocal
from app.models.models import HistorialChat, Conversacion

logger = logging.getLogger(__name__)

MAX_CONVERSACIONES = 5
MAX_FIJADAS = 5


def _es_uuid(valor: str) -> bool:
    try:
        uuid.UUID(valor)
        return True
    except ValueError:
        return False


def _generar_titulo(pregunta: str) -> str:
    palabras = pregunta.strip().replace('¿', '').replace('?', '').replace('¡', '').replace('!', '').split()
    titulo = ' '.join(palabras[:5])
    return f"{titulo}..." if len(palabras) > 5 else titulo


def crear_conversacion(usuario_id: str, pregunta: str) -> str | None:
    """Crea una nueva conversación. Si el usuario ya tiene 5 no fijadas, elimina la más antigua."""
    if not _es_uuid(usuario_id):
        return None
    db = SessionLocal()
    try:
        uid = uuid.UUID(usuario_id)
        no_fijadas = (
            db.query(Conversacion)
            .filter(Conversacion.usuario_id == uid, Conversacion.fijada == False)
            .order_by(Conversacion.creado_en.asc())
            .all()
        )
        if len(no_fijadas) >= MAX_CONVERSACIONES:
            db.delete(no_fijadas[0])
            db.commit()

        conv = Conversacion(
            id=uuid.uuid4(),
            usuario_id=uid,
            titulo=_generar_titulo(pregunta),
            fijada=False,
        )
        db.add(conv)
        db.commit()
        logger.info(f"[CHAT_SERVICE] Conversación creada — id={conv.id}")
        return str(conv.id)
    except Exception as e:
        db.rollback()
        logger.warning(f"[CHAT_SERVICE] No se pudo crear conversación: {e}")
        return None
    finally:
        db.close()


def fijar_conversacion(conversacion_id: str, usuario_id: str, fijar: bool) -> bool:
    """Fija o desfija una conversación. Máximo MAX_FIJADAS fijadas por usuario."""
    if not _es_uuid(conversacion_id) or not _es_uuid(usuario_id):
        return False
    db = SessionLocal()
    try:
        uid = uuid.UUID(usuario_id)
        conv = db.query(Conversacion).filter(
            Conversacion.id == uuid.UUID(conversacion_id),
            Conversacion.usuario_id == uid,
        ).first()
        if not conv:
            return False
        if fijar:
            total_fijadas = db.query(Conversacion).filter(
                Conversacion.usuario_id == uid,
                Conversacion.fijada == True,
            ).count()
            if total_fijadas >= MAX_FIJADAS:
                return False  # límite alcanzado
        conv.fijada = fijar
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.warning(f"[CHAT_SERVICE] No se pudo fijar conversación: {e}")
        return False
    finally:
        db.close()


def guardar_historial(
    usuario_id: str,
    query: str,
    answer: str,
    confidence_score: float,
    is_fallback: bool,
    conversacion_id: str | None = None,
) -> str | None:
    db = SessionLocal()
    try:
        registro = HistorialChat(
            id=uuid.uuid4(),
            usuario_id=uuid.UUID(usuario_id) if _es_uuid(usuario_id) else None,
            conversacion_id=uuid.UUID(conversacion_id) if conversacion_id and _es_uuid(conversacion_id) else None,
            pregunta=query,
            respuesta=answer,
            puntaje_confianza=confidence_score,
            es_fallback=is_fallback,
        )
        db.add(registro)
        db.commit()
        logger.info(f"[CHAT_SERVICE] Historial guardado — id={registro.id}")
        return str(registro.id)
    except Exception as e:
        db.rollback()
        logger.warning(f"[CHAT_SERVICE] No se pudo guardar historial: {e}")
        return None
    finally:
        db.close()


def eliminar_conversacion(conversacion_id: str, usuario_id: str) -> bool:
    if not _es_uuid(conversacion_id) or not _es_uuid(usuario_id):
        return False
    db = SessionLocal()
    try:
        conv = db.query(Conversacion).filter(
            Conversacion.id == uuid.UUID(conversacion_id),
            Conversacion.usuario_id == uuid.UUID(usuario_id),
        ).first()
        if not conv:
            return False
        db.delete(conv)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.warning(f"[CHAT_SERVICE] No se pudo eliminar conversación: {e}")
        return False
    finally:
        db.close()
