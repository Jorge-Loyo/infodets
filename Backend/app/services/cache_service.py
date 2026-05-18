import uuid
import logging
import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import CacheRespuesta

logger = logging.getLogger(__name__)

CACHE_TTL_HORAS = 24
UMBRAL_SIMILITUD_CACHE = 0.95  # coseno > 0.95 = pregunta semánticamente idéntica


def _coseno(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    n1 = math.sqrt(sum(a * a for a in v1))
    n2 = math.sqrt(sum(b * b for b in v2))
    if n1 == 0 or n2 == 0:
        return 0.0
    return dot / (n1 * n2)


def buscar_en_cache(db: Session, embedding: list[float]) -> CacheRespuesta | None:
    """Busca una respuesta cacheada semánticamente similar. Retorna None si no hay hit."""
    try:
        ahora = datetime.utcnow()
        entradas = db.query(CacheRespuesta).filter(CacheRespuesta.expira_en > ahora).all()
        mejor = None
        mejor_score = 0.0
        for entrada in entradas:
            score = _coseno(embedding, entrada.embedding)
            if score > mejor_score:
                mejor_score = score
                mejor = entrada
        if mejor and mejor_score >= UMBRAL_SIMILITUD_CACHE:
            mejor.hits += 1
            db.commit()
            logger.info(f"[Cache] HIT — similitud={mejor_score:.3f} hits={mejor.hits}")
            return mejor
        return None
    except Exception as e:
        logger.warning(f"[Cache] Error al buscar: {e}")
        return None


def guardar_en_cache(
    db: Session,
    pregunta: str,
    embedding: list[float],
    respuesta: str,
    tipo_respuesta: str,
    nivel: int,
) -> None:
    """Guarda una respuesta en el caché con TTL de 24 horas."""
    try:
        ahora = datetime.utcnow()
        entrada = CacheRespuesta(
            id=uuid.uuid4(),
            pregunta=pregunta,
            embedding=embedding,
            respuesta=respuesta,
            tipo_respuesta=tipo_respuesta,
            nivel=nivel,
            hits=0,
            creado_en=ahora,
            expira_en=ahora + timedelta(hours=CACHE_TTL_HORAS),
        )
        db.add(entrada)
        db.commit()
        logger.info(f"[Cache] GUARDADO — pregunta: {pregunta[:60]}")
    except Exception as e:
        logger.warning(f"[Cache] Error al guardar: {e}")
        db.rollback()


def invalidar_cache(db: Session) -> int:
    """Elimina todas las entradas del caché. Llamar al subir nuevo documento."""
    try:
        count = db.query(CacheRespuesta).delete()
        db.commit()
        logger.info(f"[Cache] Invalidado — {count} entradas eliminadas")
        return count
    except Exception as e:
        logger.warning(f"[Cache] Error al invalidar: {e}")
        db.rollback()
        return 0
