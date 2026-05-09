from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.dashboard_schema import DashboardStats, HotTopic
from app.schemas.common import R_401, R_403
from app.middleware.auth_middleware import require_permiso
from app.core.database import get_db
from app.models.models import (
    HistorialChat, Conversacion, TicketVacio, MensajeTicket,
    ValidacionRespuesta, ConsultaInvitado, ReporteFeedback
)

router = APIRouter(prefix="/admin", tags=["Dashboard"])


@router.delete(
    "/reset-datos",
    summary="Limpiar todos los datos de prueba",
    description="Elimina historial de chat, conversaciones, tickets, validaciones, consultas de invitados y feedback.",
    responses={**R_401, **R_403},
)
def reset_datos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("dashboard")),
):
    db.query(MensajeTicket).delete()
    db.query(TicketVacio).delete()
    db.query(ValidacionRespuesta).delete()
    db.query(ConsultaInvitado).delete()
    db.query(ReporteFeedback).delete()
    db.query(HistorialChat).delete()
    db.query(Conversacion).delete()
    db.commit()
    return {"ok": True, "mensaje": "Datos de prueba eliminados correctamente"}


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
