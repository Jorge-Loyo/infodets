from pydantic import BaseModel, EmailStr
from typing import Optional


class ChatRequest(BaseModel):
    mensaje: str
    usuario_id: str
    institucion: Optional[str] = None
    dependencia: Optional[str] = None


class ChatInvitadoRequest(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    institucion: Optional[str] = None
    mensaje: str


class FuenteDocumento(BaseModel):
    nombre: str
    url: str
    pagina: Optional[int] = None
    categoria: Optional[str] = None


class ChatChunkEvent(BaseModel):
    tipo: str = "chunk"
    texto: str


class ChatFinalEvent(BaseModel):
    tipo: str = "final"
    consulta_id: str
    fuentes: list[FuenteDocumento]
    confianza: float
    tipo_respuesta: str  # local | fallback | sin_respuesta


class ChatErrorEvent(BaseModel):
    tipo: str = "error"
    mensaje: str
