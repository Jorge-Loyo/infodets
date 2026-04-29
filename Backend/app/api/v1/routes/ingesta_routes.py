import os
import uuid
import tempfile
import httpx
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.schemas.ingesta_schema import IngestaResponse, DocumentoListItem, EstadoDocumento
from app.services.ingesta_service import procesar_documento
from app.services import documento_service
from app.core.settings import settings
from app.core.database import get_db
from app.middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/ingesta", tags=["Ingesta"])

DOCS_DIR = "uploads/documentos"
os.makedirs(DOCS_DIR, exist_ok=True)


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
    nombre_archivo = f"{document_id}.pdf"
    ruta_permanente = os.path.join(DOCS_DIR, nombre_archivo)

    contenido = await archivo.read()
    with open(ruta_permanente, 'wb') as f:
        f.write(contenido)

    try:
        chunks_procesados = await procesar_documento(
            ruta_archivo=ruta_permanente,
            document_id=document_id,
            source_url=f"/v1/admin/ingesta/ver/{document_id}",
            titulo=titulo,
        )
    except Exception as e:
        os.unlink(ruta_permanente)
        raise HTTPException(status_code=500, detail=str(e))

    url_fuente = f"/v1/admin/ingesta/ver/{document_id}"
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


@router.get("/ver/{documento_id}")
async def ver_documento(documento_id: str):
    """Sirve el PDF del documento para visualizarlo en el browser."""
    ruta = os.path.join(DOCS_DIR, f"{documento_id}.pdf")
    if not os.path.exists(ruta):
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return FileResponse(ruta, media_type="application/pdf", filename=f"{documento_id}.pdf")


@router.delete("/{documento_id}", status_code=204)
async def eliminar_documento(
    documento_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Elimina el documento de RDS, Qdrant y el archivo PDF."""
    from app.services.qdrant_service import eliminar_por_documento

    # 1. Eliminar vectores de Qdrant
    try:
        eliminar_por_documento(documento_id)
        logger.info(f"[INGESTA] Vectores eliminados de Qdrant — documento_id={documento_id}")
    except Exception as e:
        logger.warning(f"[INGESTA] No se pudo eliminar de Qdrant: {e}")

    # 2. Eliminar archivo PDF si existe
    ruta = os.path.join(DOCS_DIR, f"{documento_id}.pdf")
    if os.path.exists(ruta):
        os.unlink(ruta)

    # 3. Eliminar de RDS
    if not documento_service.eliminar_documento(db, documento_id):
        raise HTTPException(status_code=404, detail="Documento no encontrado")


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
