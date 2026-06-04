from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.schemas.dashboard_schema import DashboardStats, HotTopic, ConsultasPorDia
from app.schemas.common import R_401, R_403
from app.middleware.auth_middleware import require_permiso
from app.core.database import get_db
from app.models.models import (
    HistorialChat, Conversacion, TicketVacio, MensajeTicket,
    ValidacionRespuesta, ConsultaInvitado, ReporteFeedback,
    Documento,
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
    description="Analiza tickets de vacío y consultas con bajo score para detectar temas recurrentes sin cobertura.",
    responses={**R_401, **R_403},
)
def hot_topics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("dashboard")),
):
    # Obtener preguntas de tickets (consultas sin respuesta adecuada)
    tickets = (
        db.query(TicketVacio.pregunta)
        .filter(TicketVacio.nivel >= 2)
        .order_by(TicketVacio.creado_en.desc())
        .limit(200)
        .all()
    )

    if not tickets:
        return []

    # Agrupar por palabras clave simples (primeras 3-4 palabras significativas)
    temas: dict[str, int] = {}
    stopwords = {'que', 'qué', 'cual', 'cuál', 'como', 'cómo', 'para', 'por', 'los', 'las', 'del', 'una', 'uno', 'con', 'son', 'hay', 'puede', 'tiene', 'donde', 'dónde', 'este', 'esta', 'esos', 'esas', 'es', 'el', 'la', 'de', 'en', 'un'}
    for (pregunta,) in tickets:
        palabras = [p.lower().strip('?¿!¡.,') for p in pregunta.split() if len(p) > 2]
        palabras_clave = [p for p in palabras if p not in stopwords][:4]
        if palabras_clave:
            tema = " ".join(palabras_clave)
            temas[tema] = temas.get(tema, 0) + 1

    total = sum(temas.values())
    # Ordenar por cantidad descendente, top 10
    top = sorted(temas.items(), key=lambda x: x[1], reverse=True)[:10]

    return [
        HotTopic(
            tema=tema,
            cantidad=cantidad,
            porcentaje=round(cantidad / total * 100, 1) if total > 0 else 0,
        )
        for tema, cantidad in top
    ]


@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Estadísticas generales del sistema",
    description="Retorna métricas reales de uso: consultas, feedback, documentos, tickets y consultas por día.",
    responses={**R_401, **R_403},
)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("dashboard")),
):
    # Total consultas (autenticados + invitados)
    total_autenticados = db.query(func.count(HistorialChat.id)).scalar() or 0
    total_invitados = db.query(func.count(ConsultaInvitado.id)).scalar() or 0
    total_consultas = total_autenticados + total_invitados

    # Feedback incorrecto
    total_feedback_incorrecto = (
        db.query(func.count(ReporteFeedback.id))
        .filter(ReporteFeedback.es_correcto == False)
        .scalar() or 0
    )

    # Total documentos indexados
    total_documentos = db.query(func.count(Documento.id)).scalar() or 0

    # Consultas sin respuesta (tickets nivel 3)
    consultas_sin_respuesta = (
        db.query(func.count(TicketVacio.id))
        .filter(TicketVacio.nivel == 3)
        .scalar() or 0
    )

    # Consultas por día (últimos 30 días)
    hace_30_dias = datetime.utcnow() - timedelta(days=30)
    consultas_por_dia_raw = (
        db.query(
            cast(HistorialChat.creado_en, Date).label("fecha"),
            func.count(HistorialChat.id).label("cantidad"),
        )
        .filter(HistorialChat.creado_en >= hace_30_dias)
        .group_by(cast(HistorialChat.creado_en, Date))
        .order_by(cast(HistorialChat.creado_en, Date))
        .all()
    )

    consultas_por_dia = [
        ConsultasPorDia(fecha=str(row.fecha), cantidad=row.cantidad)
        for row in consultas_por_dia_raw
    ]

    # Hot topics (top 5 para el resumen)
    tickets_top = (
        db.query(TicketVacio.pregunta)
        .filter(TicketVacio.nivel >= 2)
        .order_by(TicketVacio.creado_en.desc())
        .limit(100)
        .all()
    )
    temas: dict[str, int] = {}
    stopwords = {'que', 'qué', 'cual', 'cuál', 'como', 'cómo', 'para', 'por', 'los', 'las', 'del', 'una', 'uno', 'con', 'son', 'hay', 'puede', 'tiene', 'donde', 'dónde', 'este', 'esta', 'es', 'el', 'la', 'de', 'en', 'un'}
    for (pregunta,) in tickets_top:
        palabras = [p.lower().strip('?¿!¡.,') for p in pregunta.split() if len(p) > 2]
        palabras_clave = [p for p in palabras if p not in stopwords][:4]
        if palabras_clave:
            tema = " ".join(palabras_clave)
            temas[tema] = temas.get(tema, 0) + 1
    total_temas = sum(temas.values()) or 1
    top_temas = sorted(temas.items(), key=lambda x: x[1], reverse=True)[:5]
    hot_topics = [
        HotTopic(tema=t, cantidad=c, porcentaje=round(c / total_temas * 100, 1))
        for t, c in top_temas
    ]

    return DashboardStats(
        total_consultas=total_consultas,
        total_feedback_incorrecto=total_feedback_incorrecto,
        total_documentos=total_documentos,
        consultas_sin_respuesta=consultas_sin_respuesta,
        hot_topics=hot_topics,
        consultas_por_dia=consultas_por_dia,
    )
