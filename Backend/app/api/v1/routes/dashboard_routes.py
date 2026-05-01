from fastapi import APIRouter, Depends
from app.schemas.dashboard_schema import DashboardStats, HotTopic
from app.schemas.common import R_401, R_403
from app.middleware.auth_middleware import require_permiso

router = APIRouter(prefix="/admin", tags=["Dashboard"])


@router.get(
    "/hot-topics",
    response_model=list[HotTopic],
    summary="Temas más consultados sin documentación oficial",
    description="Retorna los hot topics detectados por el sistema RAG para orientar la carga de documentos.",
    responses={**R_401, **R_403},
)
async def hot_topics(
    current_user: dict = Depends(require_permiso("dashboard")),
):
    # TODO Sprint 4: implementar consulta a RDS
    return []


@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Estadísticas generales del sistema",
    description="Retorna métricas de uso: consultas, feedback, documentos y hot topics.",
    responses={**R_401, **R_403},
)
async def dashboard_stats(
    current_user: dict = Depends(require_permiso("dashboard")),
):
    # TODO Sprint 4: implementar consulta a RDS
    return DashboardStats(
        total_consultas=0,
        total_feedback_incorrecto=0,
        total_documentos=0,
        consultas_sin_respuesta=0,
        hot_topics=[],
        consultas_por_dia=[],
    )
