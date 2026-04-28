import os
import uuid
import tempfile
import httpx
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.schemas.ingesta_schema import IngestaResponse, DocumentoListItem, EstadoDocumento
from app.services.ingesta_service import procesar_documento
from app.services import documento_service
from app.core.settings import settings
from app.core.database import get_db
from app.middleware.auth_middleware import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/ingesta", tags=["Ingesta"])


def _notificar_n8n(payload: dict) -> None:
    """Notifica a n8n que la ingesta completó. Falla silenciosamente."""
    if not settings.n8n_url:
        return
    try:
        url = f"{settings.n8n_url}/webhook/ingesta-completada"
        httpx.post(url, json=payload, timeout=5)
        logger.info(f"[INGESTA] n8n notificado — documento_id={payload.get('documento_id')}")
    except Exception as e:
        logger.warning(f"[INGESTA] No se pudo notificar a n8n: {e}")


@router.post("", response_model=IngestaResponse)
async def cargar_documento(
    titulo: str = Form(...),
    categoria: str = Form(...),
    dependencia: str = Form(...),
    descripcion: Optional[str] = Form(None),
    anio: Optional[int] = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    RF1 — Pipeline completo de ingesta:
    1. Recibe el PDF
    2. Extrae texto
    3. Fragmenta en chunks
    4. Genera embeddings con Google text-embedding-004
    5. Almacena vectores en Qdrant
    6. Notifica a n8n con el resultado
    """
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    document_id = str(uuid.uuid4())

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        contenido = await archivo.read()
        tmp.write(contenido)
        tmp_path = tmp.name

    try:
        chunks_procesados = await procesar_documento(
            ruta_archivo=tmp_path,
            document_id=document_id,
            source_url=f"/documentos/{document_id}",
            titulo=titulo,
        )
    finally:
        os.unlink(tmp_path)

    url_fuente = f"/documentos/{document_id}"
    documento_service.crear_documento(db, id=document_id, titulo=titulo, url_fuente=url_fuente, categoria=categoria, dependencia=dependencia)

    respuesta = IngestaResponse(
        id=document_id,
        titulo=titulo,
        categoria=categoria,
        dependencia=dependencia,
        estado=EstadoDocumento.PROCESADO,
        archivo_url=url_fuente,
        vector_id=f"qdrant:{chunks_procesados}_chunks",
        created_at=datetime.utcnow().isoformat(),
    )

    _notificar_n8n({
        "documento_id": document_id,
        "titulo": titulo,
        "categoria": categoria,
        "dependencia": dependencia,
        "estado": "procesado",
        "chunks": chunks_procesados,
    })

    return respuesta


@router.get("", response_model=list[DocumentoListItem])
async def listar_documentos(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    """Retorna el listado de documentos cargados al sistema."""
    documentos = documento_service.listar_documentos(db)
    return [
        DocumentoListItem(
            id=str(d.id),
            titulo=d.titulo,
            categoria=d.categoria or "",
            dependencia=d.dependencia or "",
            estado=EstadoDocumento.PROCESADO,
            created_at=d.creado_en.isoformat() if d.creado_en else "",
        )
        for d in documentos
    ]
