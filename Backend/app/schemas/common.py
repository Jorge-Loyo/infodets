"""
Schemas y helpers de respuesta HTTP compartidos.
Centraliza los modelos de error y los `responses` reutilizables
para que la documentación OpenAPI sea consistente en todos los endpoints.
"""
from pydantic import BaseModel
from typing import Any, Optional


# ── Modelos de error estándar ─────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    detail: str


class ErrorValidacion(BaseModel):
    detail: list[dict[str, Any]]


class MensajeOk(BaseModel):
    ok: bool
    mensaje: Optional[str] = None


# ── Bloques de responses reutilizables ────────────────────────────────────────

R_401 = {401: {"model": ErrorDetail, "description": "No autenticado — token ausente o inválido"}}
R_403 = {403: {"model": ErrorDetail, "description": "Sin permiso para esta operación"}}
R_404 = {404: {"model": ErrorDetail, "description": "Recurso no encontrado"}}
R_400 = {400: {"model": ErrorDetail, "description": "Datos de entrada inválidos"}}
R_409 = {409: {"model": ErrorDetail, "description": "Conflicto — el recurso ya existe"}}
R_422 = {422: {"model": ErrorValidacion, "description": "Error de validación de campos"}}
R_500 = {500: {"model": ErrorDetail, "description": "Error interno del servidor"}}
R_503 = {503: {"model": ErrorDetail, "description": "Servicio externo no disponible"}}

# Combinaciones frecuentes
R_AUTH = {**R_401, **R_403}
R_CRUD = {**R_401, **R_403, **R_404, **R_422}
R_CREATE = {**R_401, **R_403, **R_400, **R_422}
