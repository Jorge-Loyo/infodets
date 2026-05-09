from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.feedback_schema import FeedbackRequest, FeedbackResponse
from app.schemas.common import R_401, R_403, R_404, R_422
from app.middleware.auth_middleware import get_current_user
from app.core.database import get_db
from app.models.models import ReporteFeedback, HistorialChat

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post(
    "/report",
    response_model=FeedbackResponse,
    status_code=201,
    summary="Reportar feedback sobre una respuesta",
    description=(
        "Registra el feedback del operador sobre una respuesta del sistema. "
        "Si el tipo es `incorrecto`, activa el loop de retroalimentación en n8n."
    ),
    responses={
        201: {"description": "Feedback registrado"},
        **R_401,
        **R_404,
        **R_422,
    },
)
async def reportar_feedback(
    request: FeedbackRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        historial_id = UUID(request.consulta_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="consulta_id debe ser un UUID válido")

    historial = db.query(HistorialChat).filter(HistorialChat.id == historial_id).first()
    if not historial:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    usuario_actual = current_user.get("_usuario_id") or current_user.get("usuario_id") or current_user.get("id")
    if current_user.get("rol") != "admin" and str(usuario_actual) != str(historial.usuario_id):
        raise HTTPException(status_code=403, detail="No autorizado para enviar feedback sobre esta consulta")

    reporte = ReporteFeedback(
        historial_id=historial_id,
        es_correcto=request.tipo == "correcto",
        comentario=request.comentario,
    )
    db.add(reporte)
    db.commit()
    db.refresh(reporte)

    return FeedbackResponse(
        id=str(reporte.id),
        consulta_id=str(reporte.historial_id),
        usuario_id=str(historial.usuario_id),
        tipo="correcto" if reporte.es_correcto else "incorrecto",
        comentario=reporte.comentario,
        created_at=reporte.creado_en.isoformat(),
    )


@router.get(
    "",
    response_model=list[FeedbackResponse],
    summary="Listar feedback registrado",
    description="Retorna el listado de feedback para el panel de administración.",
    responses={**R_401, **R_403},
)
async def listar_feedback(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver feedback")

    reportes = db.query(ReporteFeedback).all()
    return [
        FeedbackResponse(
            id=str(reporte.id),
            consulta_id=str(reporte.historial_id),
            usuario_id=str(reporte.historial.usuario_id) if reporte.historial else "",
            tipo="correcto" if reporte.es_correcto else "incorrecto",
            comentario=reporte.comentario,
            created_at=reporte.creado_en.isoformat(),
        )
        for reporte in reportes
    ]
