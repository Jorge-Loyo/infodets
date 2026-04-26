from pydantic import BaseModel
from typing import Optional
from enum import Enum


class EstadoDocumento(str, Enum):
    PENDIENTE = "pendiente"
    PROCESADO = "procesado"
    ERROR = "error"


class IngestaRequest(BaseModel):
    titulo: str
    categoria: str
    dependencia: str
    descripcion: Optional[str] = None
    anio: Optional[int] = None
    subido_por: str


class IngestaResponse(BaseModel):
    id: str
    titulo: str
    categoria: str
    dependencia: str
    estado: EstadoDocumento
    archivo_url: str
    vector_id: Optional[str] = None
    created_at: str


class DocumentoListItem(BaseModel):
    id: str
    titulo: str
    categoria: str
    dependencia: str
    estado: EstadoDocumento
    created_at: str
