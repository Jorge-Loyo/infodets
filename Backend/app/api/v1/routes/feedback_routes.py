from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.feedback_schema import FeedbackRequest, FeedbackResponse, FeedbackTipo
from app.schemas.common import R_401, R_403, R_404, R_422
from app.middleware.auth_middleware import get_current_user
from app.services import feedback_service
from app.core.database import get_db

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/report", response_model=FeedbackResponse, status_code=201, responses={**R_401, **R_404, **R_422})
async def reportar_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    es_correcto = request.tipo == FeedbackTipo.CORRECTO
    reporte = feedback_service.crear_feedback(
        db,
        historial_id=request.consulta_id,
        es_correcto=es_correcto,
        comentario=request.comentario,
    )
    return FeedbackResponse(
        id=str(reporte.id),
        consulta_id=str(reporte.historial_id),
        usuario_id=request.usuario_id,
        tipo=request.tipo,
        comentario=reporte.comentario,
        created_at=reporte.creado_en.isoformat() if reporte.creado_en else None,
    )


@router.get("", response_model=list[FeedbackResponse], responses={**R_401, **R_403})
async def listar_feedback(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reportes = feedback_service.listar_feedback(db)
    return [
        FeedbackResponse(
            id=str(r.id),
            consulta_id=str(r.historial_id),
            usuario_id="",
            tipo=FeedbackTipo.CORRECTO if r.es_correcto else FeedbackTipo.INCORRECTO,
            comentario=r.comentario,
            created_at=r.creado_en.isoformat() if r.creado_en else None,
        )
        for r in reportes
    ]
