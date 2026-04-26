import uuid
import logging
from app.core.database import SessionLocal
from app.models.models import HistorialChat

logger = logging.getLogger(__name__)


def guardar_historial(
    usuario_id: str,
    query: str,
    answer: str,
    confidence_score: float,
    is_fallback: bool,
) -> str | None:
    """
    Guarda una consulta en la tabla chat_history de RDS.
    Retorna el chat_id generado, o None si falla (ej: tablas aún no migradas).
    Falla silenciosamente para no interrumpir el chat.
    """
    db = SessionLocal()
    try:
        registro = HistorialChat(
            id=uuid.uuid4(),
            usuario_id=uuid.UUID(usuario_id) if _es_uuid(usuario_id) else None,
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
        logger.warning(f"[CHAT_SERVICE] No se pudo guardar historial (pendiente migración P2): {e}")
        return None
    finally:
        db.close()


def _es_uuid(valor: str) -> bool:
    try:
        uuid.UUID(valor)
        return True
    except ValueError:
        return False
