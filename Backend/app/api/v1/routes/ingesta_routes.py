import os
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import httpx

from app.schemas.ingesta_schema import IngestaResponse, DocumentoListItem, EstadoDocumento
from app.schemas.common import R_400, R_401, R_403, R_404, R_500
from app.services.ingesta_service import procesar_documento
from app.services import documento_service
from app.core.settings import settings
from app.core.database import get_db
from app.middleware.auth_middleware import require_permiso

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/ingesta", tags=["Ingesta"])

DOCS_DIR = "uploads/documentos"
os.makedirs(DOCS_DIR, exist_ok=True)


def _notificar_n8n(payload: dict) -> None:
    """Notifica a n8n que la ingesta completó. Falla silenciosamente."""
    if not settings.n8n_url:
        return
    try:
        httpx.post(f"{settings.n8n_url}/webhook/ingesta-completada", json=payload, timeout=5)
        logger.info(f"[INGESTA] n8n notificado — documento_id={payload.get('documento_id')}")
    except Exception as e:
        logger.warning(f"[INGESTA] No se pudo notificar a n8n: {e}")


def _validar_documento_id(documento_id: str) -> None:
    """Valida que el documento_id sea un UUID válido para prevenir path traversal."""
    try:
        uuid.UUID(documento_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de documento inválido")


@router.post(
    "",
    response_model=IngestaResponse,
    status_code=201,
    summary="Cargar y procesar documento PDF",
    description=(
        "Pipeline completo de ingesta: recibe el PDF, extrae texto, fragmenta en chunks, "
        "genera embeddings con Google text-embedding-004, almacena vectores en Qdrant "
        "y notifica a n8n."
    ),
    responses={
        201: {"description": "Documento procesado e indexado exitosamente"},
        **R_400,
        **R_401,
        **R_403,
        **R_500,
    },
)
async def cargar_documento(
    titulo: str = Form(...),
    categoria: str = Form(...),
    dependencia: str = Form(...),
    descripcion: Optional[str] = Form(None),
    anio: Optional[int] = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_documentos")),
):
    if not archivo.filename or not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    document_id = str(uuid.uuid4())
    ruta_permanente = os.path.join(DOCS_DIR, f"{document_id}.pdf")

    contenido = await archivo.read()
    with open(ruta_permanente, "wb") as f:
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
    documento_service.crear_documento(
        db, id=document_id, titulo=titulo,
        url_fuente=url_fuente, categoria=categoria, dependencia=dependencia,
    )

    _notificar_n8n({
        "documento_id": document_id,
        "titulo": titulo,
        "categoria": categoria,
        "dependencia": dependencia,
        "estado": "procesado",
        "chunks": chunks_procesados,
    })

    return IngestaResponse(
        id=document_id,
        titulo=titulo,
        categoria=categoria,
        dependencia=dependencia,
        estado=EstadoDocumento.PROCESADO,
        archivo_url=url_fuente,
        vector_id=f"qdrant:{chunks_procesados}_chunks",
        created_at=datetime.utcnow().isoformat(),
    )


@router.get(
    "/ver/{documento_id}",
    summary="Visualizar documento PDF",
    description="Sirve el PDF del documento para visualizarlo en el browser. Endpoint público.",
    responses={
        200: {"description": "Archivo PDF", "content": {"application/pdf": {}}},
        **R_400,
        **R_404,
    },
)
async def ver_documento(documento_id: str):
    _validar_documento_id(documento_id)
    ruta = os.path.join(DOCS_DIR, f"{documento_id}.pdf")
    if not os.path.exists(ruta):
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return FileResponse(ruta, media_type="application/pdf", filename=f"{documento_id}.pdf")


@router.get(
    "",
    response_model=list[DocumentoListItem],
    summary="Listar documentos indexados (admin)",
    responses={**R_401, **R_403},
)
async def listar_documentos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_documentos")),
):
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


@router.delete(
    "/{documento_id}",
    status_code=204,
    summary="Eliminar documento",
    description="Elimina el documento de la base de datos, los vectores de Qdrant y el archivo PDF.",
    responses={**R_401, **R_403, **R_404},
)
async def eliminar_documento(
    documento_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_documentos")),
):
    _validar_documento_id(documento_id)
    from app.services.qdrant_service import eliminar_por_documento

    try:
        eliminar_por_documento(documento_id)
        logger.info(f"[INGESTA] Vectores eliminados de Qdrant — documento_id={documento_id}")
    except Exception as e:
        logger.warning(f"[INGESTA] No se pudo eliminar de Qdrant: {e}")

    ruta = os.path.join(DOCS_DIR, f"{documento_id}.pdf")
    if os.path.exists(ruta):
        os.unlink(ruta)

    if not documento_service.eliminar_documento(db, documento_id):
        raise HTTPException(status_code=404, detail="Documento no encontrado")


# ── Router público ────────────────────────────────────────────────────────────

public_router = APIRouter(prefix="/ingesta", tags=["Ingesta Pública"])


@public_router.get(
    "/recientes",
    response_model=list[DocumentoListItem],
    summary="Últimos documentos indexados",
    description="Retorna los últimos 6 documentos indexados. No requiere autenticación.",
)
async def listar_documentos_recientes(db: Session = Depends(get_db)):
    documentos = documento_service.listar_documentos_publico(db, limite=6)
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
