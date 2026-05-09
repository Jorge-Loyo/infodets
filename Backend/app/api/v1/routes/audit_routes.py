from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.middleware.auth_middleware import require_permiso
from app.services import audit_service
from app.schemas.common import R_401, R_403

router = APIRouter(prefix="/audit", tags=["Auditoría"])


class AuditLogSchema(BaseModel):
    id: str
    accion: str
    entidad: str
    entidad_id: Optional[str] = None
    entidad_nombre: Optional[str] = None
    detalle: Optional[str] = None
    realizado_por_id: Optional[str] = None
    realizado_por_email: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True


@router.get(
    "",
    response_model=list[AuditLogSchema],
    summary="Listar log de auditoría de usuarios",
    responses={**R_401, **R_403},
)
def listar_audit_log(
    accion: Optional[str] = Query(None),
    entidad: Optional[str] = Query(None),
    limite: int = Query(200, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
    logs = audit_service.listar(db, accion=accion, entidad=entidad, limite=limite)
    return [
        AuditLogSchema(
            id=str(l.id),
            accion=l.accion,
            entidad=l.entidad,
            entidad_id=l.entidad_id,
            entidad_nombre=l.entidad_nombre,
            detalle=l.detalle,
            realizado_por_id=l.realizado_por_id,
            realizado_por_email=l.realizado_por_email,
            creado_en=l.creado_en,
        )
        for l in logs
    ]
