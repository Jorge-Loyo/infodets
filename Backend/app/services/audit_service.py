import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import AuditLog


def registrar(
    db: Session,
    accion: str,
    entidad: str,
    entidad_id: str | None = None,
    entidad_nombre: str | None = None,
    detalle: str | None = None,
    realizado_por_id: str | None = None,
    realizado_por_email: str | None = None,
) -> None:
    try:
        log = AuditLog(
            id=uuid.uuid4(),
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            entidad_nombre=entidad_nombre,
            detalle=detalle,
            realizado_por_id=realizado_por_id,
            realizado_por_email=realizado_por_email,
            creado_en=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()


def listar(
    db: Session,
    accion: str | None = None,
    entidad: str | None = None,
    limite: int = 200,
) -> list[AuditLog]:
    q = db.query(AuditLog)
    if accion:
        q = q.filter(AuditLog.accion == accion)
    if entidad:
        q = q.filter(AuditLog.entidad == entidad)
    return q.order_by(AuditLog.creado_en.desc()).limit(limite).all()
