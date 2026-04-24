from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
from app.schemas.ingesta_schema import IngestaResponse, DocumentoListItem
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/admin/ingesta", tags=["Ingesta"])


@router.post("", response_model=IngestaResponse)
async def cargar_documento(
    titulo: str = Form(...),
    categoria: str = Form(...),
    dependencia: str = Form(...),
    descripcion: Optional[str] = Form(None),
    anio: Optional[int] = Form(None),
    archivo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    RF1 — Ingesta controlada de documentos.
    Recibe el PDF, lo sube a S3 y dispara el pipeline de n8n
    para fragmentar y vectorizar en Pinecone/Qdrant.
    """
    # TODO Sprint 2: implementar subida a S3 + trigger n8n
    raise NotImplementedError("Pendiente Sprint 2")


@router.get("", response_model=list[DocumentoListItem])
async def listar_documentos(
    current_user: dict = Depends(get_current_user)
):
    """Retorna el listado de documentos cargados al sistema."""
    # TODO Sprint 2: implementar consulta a RDS
    return []
