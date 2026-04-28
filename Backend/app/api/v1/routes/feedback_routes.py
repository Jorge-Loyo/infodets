from fastapi import APIRouter, Depends, HTTPException
from app.schemas.feedback_schema import FeedbackRequest, FeedbackResponse
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/report", response_model=FeedbackResponse, status_code=201)
async def reportar_feedback(
    request: FeedbackRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    RF4 — Motor de mejora continua.
    Registra el feedback del operador sobre una respuesta.
    Si el tipo es 'incorrecto', activa el loop de retroalimentación en n8n.
    """
    # TODO Sprint 4: implementar guardado en RDS + trigger n8n
    raise NotImplementedError("Pendiente Sprint 4")


@router.get("", response_model=list[FeedbackResponse], status_code=200)
async def listar_feedback(
    current_user: dict = Depends(get_current_user)
):
    """Retorna el listado de feedback para el panel admin."""
    # TODO Sprint 4: implementar consulta a RDS
    return []
