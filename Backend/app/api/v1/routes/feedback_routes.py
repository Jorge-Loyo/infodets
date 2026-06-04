from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.schemas.feedback_schema import FeedbackRequest, FeedbackResponse
from app.schemas.common import R_401, R_403, R_404, R_422
from app.middleware.auth_middleware import get_current_user, require_permiso
from app.core.database import get_db
from app.models.models import ReporteFeedback, HistorialChat
from app.services.validacion_service import crear_validacion
from app.services.notificacion_service import notificar_admin_sync

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=201,
    summary="Registrar feedback sobre una respuesta",
    description=(
        "Registra si la respuesta fue correcta o incorrecta. "
        "Si es incorrecto, crea una validación pendiente para revisión del admin."
    ),
    responses={
        201: {"description": "Feedback registrado"},
        **R_401,
        **R_404,
        **R_422,
    },
)
def reportar_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    historial = db.query(HistorialChat).filter(HistorialChat.id == request.consulta_id).first()
    if not historial:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    feedback = ReporteFeedback(
        historial_id=historial.id,
        es_correcto=request.tipo == "correcto",
        comentario=request.comentario,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    # Si es incorrecto, crear validación pendiente para el admin
    if request.tipo == "incorrecto":
        crear_validacion(
            db,
            pregunta=historial.pregunta,
            respuesta=historial.respuesta,
            puntaje=historial.puntaje_confianza,
            fuente="feedback",
        )
        notificar_admin_sync("validacion_pendiente", {
            "pregunta": historial.pregunta,
            "score": round(historial.puntaje_confianza, 3),
            "fuente": "feedback_usuario",
            "mensaje": f"Un usuario reportó respuesta incorrecta. Comentario: {request.comentario or 'Sin comentario'}",
        })

    return FeedbackResponse(
        id=str(feedback.id),
        consulta_id=str(historial.id),
        usuario_id=request.usuario_id,
        tipo=request.tipo,
        comentario=request.comentario,
        created_at=feedback.creado_en.isoformat(),
    )


@router.get(
    "",
    response_model=list[FeedbackResponse],
    summary="Listar feedback registrado (admin)",
    responses={**R_401, **R_403},
)
def listar_feedback(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("ver_validaciones")),
):
    feedbacks = (
        db.query(ReporteFeedback)
        .order_by(ReporteFeedback.creado_en.desc())
        .limit(100)
        .all()
    )
    return [
        FeedbackResponse(
            id=str(f.id),
            consulta_id=str(f.historial_id),
            usuario_id="",
            tipo="correcto" if f.es_correcto else "incorrecto",
            comentario=f.comentario,
            created_at=f.creado_en.isoformat(),
        )
        for f in feedbacks
    ]
