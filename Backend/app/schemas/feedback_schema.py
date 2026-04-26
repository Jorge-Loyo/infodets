from pydantic import BaseModel
from typing import Optional
from enum import Enum


class FeedbackTipo(str, Enum):
    CORRECTO = "correcto"
    INCORRECTO = "incorrecto"


class FeedbackRequest(BaseModel):
    consulta_id: str
    usuario_id: str
    tipo: FeedbackTipo
    comentario: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    consulta_id: str
    usuario_id: str
    tipo: FeedbackTipo
    comentario: Optional[str] = None
    created_at: str
