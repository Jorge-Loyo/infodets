from fastapi import APIRouter, Depends, HTTPException
from app.schemas.feedback_schema import FeedbackRequest, FeedbackResponse
from app.schemas.common import R_401, R_403, R_404, R_422
from app.middleware.auth_middleware import get_current_user

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
):
    # TODO Sprint 4: implementar guardado en RDS + trigger n8n
    raise HTTPException(status_code=501, detail="Pendiente de implementación en Sprint 4")


@router.get(
    "",
    response_model=list[FeedbackResponse],
    summary="Listar feedback registrado",
    description="Retorna el listado de feedback para el panel de administración.",
    responses={**R_401, **R_403},
)
async def listar_feedback(
    current_user: dict = Depends(get_current_user),
):
    # TODO Sprint 4: implementar consulta a RDS
    return []
