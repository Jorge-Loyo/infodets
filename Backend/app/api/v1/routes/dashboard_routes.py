from fastapi import APIRouter, Depends
from app.schemas.dashboard_schema import DashboardStats, HotTopic
from app.middleware.auth_middleware import require_admin

router = APIRouter(prefix="/admin", tags=["Dashboard"])


@router.get("/hot-topics", response_model=list[HotTopic])
async def hot_topics(
    current_user: dict = Depends(require_admin)
):
    """
    RF4 — Visualización de hot topics para administradores.
    Retorna los temas más consultados sin documentación oficial.
    """
    # TODO Sprint 4: implementar consulta a RDS
    return []


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_stats(
    current_user: dict = Depends(require_admin)
):
    """Retorna las estadísticas generales del sistema para el dashboard."""
    # TODO Sprint 4: implementar consulta a RDS
    return DashboardStats(
        total_consultas=0,
        total_feedback_incorrecto=0,
        total_documentos=0,
        consultas_sin_respuesta=0,
        hot_topics=[],
        consultas_por_dia=[]
    )
