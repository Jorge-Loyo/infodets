from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional

from app.core.database import get_db
from app.schemas.common import R_401, R_403, R_404
from app.services import validacion_service
from app.middleware.auth_middleware import require_permiso

router = APIRouter(prefix="/validaciones", tags=["Validaciones IA"])


class ValidacionSchema(BaseModel):
    id: str
    pregunta: str
    respuesta: str
    puntaje_confianza: float
    fuente: str
    estado: str
    creado_en: str

    @field_validator("id", mode="before")
    @classmethod
    def uuid_to_str(cls, v):
        return str(v) if v is not None else None

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, v) -> "ValidacionSchema":
        return cls(
            id=str(v.id),
            pregunta=v.pregunta,
            respuesta=v.respuesta,
            puntaje_confianza=v.puntaje_confianza,
            fuente=v.fuente,
            estado=v.estado,
            creado_en=v.creado_en.isoformat(),
        )


@router.get(
    "",
    response_model=list[ValidacionSchema],
    summary="Listar validaciones pendientes",
    description="Filtrá por estado: `pendiente`, `aprobado`, `rechazado` o `auto_indexado`.",
    responses={**R_401, **R_403},
)
def listar(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("ver_validaciones")),
):
    return [ValidacionSchema.from_model(v) for v in validacion_service.listar_validaciones(db, estado)]


@router.post(
    "/{validacion_id}/aprobar",
    response_model=ValidacionSchema,
    status_code=200,
    summary="Aprobar validación",
    description="Aprueba la respuesta para que sea indexada en la base de conocimiento.",
    responses={**R_401, **R_403, **R_404},
)
def aprobar(
    validacion_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("ver_validaciones")),
):
    v = validacion_service.aprobar(db, validacion_id)
    if not v:
        raise HTTPException(status_code=404, detail="Validación no encontrada o ya procesada")
    return ValidacionSchema.from_model(v)


@router.post(
    "/{validacion_id}/rechazar",
    response_model=ValidacionSchema,
    status_code=200,
    summary="Rechazar validación",
    description="Rechaza la respuesta — no será indexada.",
    responses={**R_401, **R_403, **R_404},
)
def rechazar(
    validacion_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("ver_validaciones")),
):
    v = validacion_service.rechazar(db, validacion_id)
    if not v:
        raise HTTPException(status_code=404, detail="Validación no encontrada")
    return ValidacionSchema.from_model(v)
