import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import MemoriaUsuario, Usuario

logger = logging.getLogger(__name__)

MAX_RESUMEN_CHARS = 1500
MAX_CONSULTAS_RESUMEN = 10  # últimas N consultas para actualizar el resumen


def obtener_memoria(db: Session, usuario_id: str) -> dict:
    """Retorna nombre y resumen de memoria del usuario."""
    try:
        uid = uuid.UUID(usuario_id)
        memoria = db.query(MemoriaUsuario).filter(MemoriaUsuario.usuario_id == uid).first()
        if memoria:
            return {
                "nombre": memoria.nombre,
                "resumen": memoria.resumen,
                "total_consultas": memoria.total_consultas,
                "es_primera_consulta": memoria.total_consultas == 0,
            }
        # Si no existe memoria, buscar nombre en tabla usuarios
        usuario = db.query(Usuario).filter(Usuario.id == uid).first()
        nombre = f"{usuario.nombre or ''} {usuario.apellido or ''}".strip() if usuario else None
        return {"nombre": nombre, "resumen": None, "total_consultas": 0, "es_primera_consulta": True}
    except Exception as e:
        logger.warning(f"[MEMORIA] Error al obtener memoria: {e}")
        return {"nombre": None, "resumen": None, "total_consultas": 0, "es_primera_consulta": True}


def actualizar_memoria(db: Session, usuario_id: str, pregunta: str, respuesta: str) -> None:
    """Actualiza el resumen de memoria del usuario con la nueva consulta."""
    try:
        uid = uuid.UUID(usuario_id)
        memoria = db.query(MemoriaUsuario).filter(MemoriaUsuario.usuario_id == uid).first()

        if not memoria:
            usuario = db.query(Usuario).filter(Usuario.id == uid).first()
            nombre = f"{usuario.nombre or ''} {usuario.apellido or ''}".strip() if usuario else None
            memoria = MemoriaUsuario(
                id=uuid.uuid4(),
                usuario_id=uid,
                nombre=nombre,
                resumen="",
                total_consultas=0,
                actualizado_en=datetime.utcnow(),
            )
            db.add(memoria)

        # Agregar nueva consulta al resumen
        nueva_entrada = f"- Preguntó: {pregunta[:200]}"
        resumen_actual = memoria.resumen or ""
        # Mantener solo las últimas N entradas
        lineas = [l for l in resumen_actual.split("\n") if l.strip()]
        lineas.append(nueva_entrada)
        lineas = lineas[-MAX_CONSULTAS_RESUMEN:]
        memoria.resumen = "\n".join(lineas)[:MAX_RESUMEN_CHARS]
        memoria.total_consultas += 1
        memoria.actualizado_en = datetime.utcnow()
        db.commit()
    except Exception as e:
        logger.warning(f"[MEMORIA] Error al actualizar memoria: {e}")
        db.rollback()
