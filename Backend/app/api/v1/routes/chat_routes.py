import json
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.chat_schema import ChatRequest, ChatInvitadoRequest
from app.schemas.common import MensajeOk, R_400, R_401, R_403, R_404
from app.services.rag_service import (
    buscar_contexto,
    generar_respuesta_stream,
    ejecutar_loop_retroalimentacion,
    AVISO_FUENTE_EXTERNA,
    MENSAJE_ESCALAMIENTO,
    CONFIDENCE_THRESHOLD,
)
from app.services.chat_service import (
    guardar_historial, crear_conversacion,
    eliminar_conversacion, fijar_conversacion,
)
from app.services.ticket_service import crear_ticket, UMBRAL_TICKET
from app.services.validacion_service import crear_validacion
from app.services.notificacion_service import notificar_admin_sync
from app.middleware.auth_middleware import get_current_user
from app.core.database import get_db, SessionLocal
from app.models.models import HistorialChat, ConsultaInvitado, Conversacion

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


# ── Streaming ─────────────────────────────────────────────────────────────────

@router.post(
    "/stream",
    summary="Consulta con respuesta en streaming (SSE)",
    description=(
        "Envía una consulta al sistema RAG. La respuesta se transmite como Server-Sent Events. "
        "Cada evento tiene un campo `tipo`: `chunk` (texto parcial), `final` (metadatos) o `error`."
    ),
    responses={
        200: {
            "description": "Stream SSE con chunks de respuesta",
            "content": {"text/event-stream": {}},
        },
        **R_401,
    },
)
async def chat_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    consulta_id = str(uuid.uuid4())
    usuario_id = current_user.get("_usuario_id", "") or request.usuario_id
    conversacion_id = request.conversacion_id

    def generate():
        try:
            resultados, max_score = buscar_contexto(request.mensaje)
            resultado = ejecutar_loop_retroalimentacion(request.mensaje, max_score, resultados)

            logger.info(
                f"[CHAT] consulta_id={consulta_id} | score={max_score:.3f} "
                f"| nivel={resultado.nivel} | tipo={resultado.tipo_respuesta}"
            )

            # Nivel 3 — escalamiento humano
            if resultado.nivel == 3:
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': MENSAJE_ESCALAMIENTO})}\n\n"
                db_t = SessionLocal()
                try:
                    crear_ticket(db_t, pregunta=request.mensaje, usuario_id=usuario_id, puntaje=max_score, nivel=3)
                finally:
                    db_t.close()
                notificar_admin_sync("nivel3_escalamiento", {
                    "pregunta": request.mensaje,
                    "usuario_id": usuario_id,
                    "score": round(max_score, 3),
                    "mensaje": "Consulta sin respuesta en ninguna fuente. Requiere atención humana.",
                })
                yield f"data: {json.dumps({'tipo': 'final', 'consulta_id': consulta_id, 'fuentes': [], 'confianza': round(max_score, 3), 'tipo_respuesta': 'escalamiento'})}\n\n"
                return

            # Niveles 1 y 2 — respuesta de fuente externa
            if resultado.nivel in (1, 2):
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': AVISO_FUENTE_EXTERNA})}\n\n"
                notificar_admin_sync(f"nivel{resultado.nivel}_externo", {
                    "pregunta": request.mensaje,
                    "usuario_id": usuario_id,
                    "score": round(max_score, 3),
                    "mensaje": f"Respuesta obtenida de fuente externa (Nivel {resultado.nivel}). Considerar agregar documentación oficial.",
                })

            respuesta_completa = []
            for texto in generar_respuesta_stream(request.mensaje, resultado.contexto, is_fallback=(resultado.nivel > 0)):
                respuesta_completa.append(texto)
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': texto})}\n\n"

            guardar_historial(
                usuario_id=usuario_id,
                query=request.mensaje,
                answer="".join(respuesta_completa),
                confidence_score=max_score,
                is_fallback=resultado.nivel > 0,
                conversacion_id=conversacion_id,
            )

            if max_score < UMBRAL_TICKET:
                db_t = SessionLocal()
                try:
                    crear_ticket(db_t, pregunta=request.mensaje, usuario_id=usuario_id, puntaje=max_score, nivel=resultado.nivel)
                finally:
                    db_t.close()

            db_val = SessionLocal()
            try:
                val = crear_validacion(db_val, pregunta=request.mensaje, respuesta="".join(respuesta_completa), puntaje=max_score, fuente="usuario")
                if val and val.estado == "pendiente":
                    notificar_admin_sync("validacion_pendiente", {
                        "pregunta": request.mensaje,
                        "score": round(max_score, 3),
                        "fuente": "usuario",
                        "mensaje": f"Respuesta con confianza {round(max_score * 100)}% requiere revisión manual para indexar en la IA.",
                    })
            finally:
                db_val.close()

            fuentes = []
            if resultado.nivel == 0:
                vistos = set()
                for r in resultados:
                    if r.get("source_url", "").startswith("/v1/"):
                        nombre = r.get("titulo") or r.get("source_url", "").split("/")[-1] or "Documento oficial"
                        if nombre not in vistos:
                            vistos.add(nombre)
                            fuentes.append({"nombre": nombre, "url": r.get("source_url", ""), "pagina": r.get("page_number", 0)})

            yield f"data: {json.dumps({'tipo': 'final', 'consulta_id': consulta_id, 'fuentes': fuentes, 'confianza': round(max_score, 3), 'tipo_respuesta': resultado.tipo_respuesta})}\n\n"

        except (ValueError, RuntimeError, ConnectionError) as e:
            logger.error(f"[CHAT] Error: {e}")
            yield f"data: {json.dumps({'tipo': 'error', 'mensaje': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post(
    "/invitado",
    summary="Consulta de usuario invitado con streaming (SSE)",
    description="Permite consultas sin autenticación. Requiere nombre, apellido y email del invitado.",
    responses={
        200: {
            "description": "Stream SSE con chunks de respuesta",
            "content": {"text/event-stream": {}},
        },
    },
)
async def chat_invitado(request: ChatInvitadoRequest):
    def generate():
        db = SessionLocal()
        try:
            resultados, max_score = buscar_contexto(request.mensaje)
            resultado = ejecutar_loop_retroalimentacion(request.mensaje, max_score, resultados)

            if resultado.nivel == 3:
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': MENSAJE_ESCALAMIENTO})}\n\n"
                crear_ticket(db, pregunta=request.mensaje, usuario_id=f"invitado:{request.email}", puntaje=max_score)
                db.add(ConsultaInvitado(
                    nombre=request.nombre, apellido=request.apellido,
                    email=request.email, institucion=request.institucion,
                    pregunta=request.mensaje, respuesta=MENSAJE_ESCALAMIENTO,
                    puntaje_confianza=max_score,
                ))
                db.commit()
                notificar_admin_sync("nivel3_escalamiento", {
                    "pregunta": request.mensaje,
                    "usuario_id": f"invitado:{request.email}",
                    "score": round(max_score, 3),
                    "mensaje": "Consulta de invitado sin respuesta. Requiere atención humana.",
                })
                yield f"data: {json.dumps({'tipo': 'final', 'confianza': round(max_score, 3), 'tipo_respuesta': 'escalamiento'})}\n\n"
                return

            if resultado.nivel in (1, 2):
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': AVISO_FUENTE_EXTERNA})}\n\n"
                notificar_admin_sync(f"nivel{resultado.nivel}_externo", {
                    "pregunta": request.mensaje,
                    "usuario_id": f"invitado:{request.email}",
                    "score": round(max_score, 3),
                    "mensaje": f"Respuesta de invitado obtenida de fuente externa (Nivel {resultado.nivel}).",
                })

            respuesta_completa = []
            for texto in generar_respuesta_stream(request.mensaje, resultado.contexto, is_fallback=(resultado.nivel > 0)):
                respuesta_completa.append(texto)
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': texto})}\n\n"

            respuesta_texto = "".join(respuesta_completa)
            db.add(ConsultaInvitado(
                nombre=request.nombre, apellido=request.apellido,
                email=request.email, institucion=request.institucion,
                pregunta=request.mensaje, respuesta=respuesta_texto,
                puntaje_confianza=max_score,
            ))
            db.commit()

            if max_score < UMBRAL_TICKET:
                crear_ticket(db, pregunta=request.mensaje, usuario_id=f"invitado:{request.email}", puntaje=max_score)

            val = crear_validacion(db, pregunta=request.mensaje, respuesta=respuesta_texto, puntaje=max_score, fuente="invitado")
            if val and val.estado == "pendiente":
                notificar_admin_sync("validacion_pendiente", {
                    "pregunta": request.mensaje,
                    "score": round(max_score, 3),
                    "fuente": "invitado",
                    "mensaje": f"Respuesta de invitado con confianza {round(max_score * 100)}% requiere revisión manual.",
                })

            yield f"data: {json.dumps({'tipo': 'final', 'confianza': round(max_score, 3), 'tipo_respuesta': resultado.tipo_respuesta})}\n\n"

        except Exception as e:
            logger.error(f"[CHAT INVITADO] Error: {e}")
            yield f"data: {json.dumps({'tipo': 'error', 'mensaje': str(e)})}\n\n"
        finally:
            db.close()

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── Conversaciones ────────────────────────────────────────────────────────────

class ConversacionResponse(BaseModel):
    conversacion_id: str


@router.post(
    "/conversacion",
    response_model=ConversacionResponse,
    status_code=201,
    summary="Crear nueva conversación",
    description="Crea una nueva conversación. Si el usuario ya tiene 5 no fijadas, elimina la más antigua.",
    responses={
        201: {"description": "Conversación creada"},
        **R_401,
        500: {"description": "No se pudo crear la conversación"},
    },
)
def nueva_conversacion(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id", "")
    conv_id = crear_conversacion(usuario_id, body.get("pregunta", "Nueva conversación"))
    if not conv_id:
        raise HTTPException(status_code=500, detail="No se pudo crear la conversación")
    return {"conversacion_id": conv_id}


@router.patch(
    "/conversacion/{conversacion_id}/fijar",
    response_model=MensajeOk,
    summary="Fijar o desfijar conversación",
    description="Máximo 5 conversaciones fijadas por usuario.",
    responses={
        **R_401,
        400: {"description": "Límite de conversaciones fijadas alcanzado (máx 5) o conversación no encontrada"},
    },
)
def toggle_fijar(
    conversacion_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id", "")
    fijar = body.get("fijada", True)
    ok = fijar_conversacion(conversacion_id, usuario_id, fijar)
    if not ok:
        detail = "Límite de conversaciones fijadas alcanzado (máx 5)" if fijar else "Conversación no encontrada"
        raise HTTPException(status_code=400, detail=detail)
    return {"ok": True}


@router.delete(
    "/conversacion/{conversacion_id}",
    status_code=204,
    summary="Eliminar conversación",
    description="Elimina la conversación y todos sus mensajes.",
    responses={**R_401, **R_404},
)
def borrar_conversacion(
    conversacion_id: str,
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id", "")
    if not eliminar_conversacion(conversacion_id, usuario_id):
        raise HTTPException(status_code=404, detail="Conversación no encontrada")


@router.get(
    "/conversaciones/{usuario_id}",
    summary="Listar conversaciones de un usuario",
    description="Retorna las conversaciones ordenadas: fijadas primero, luego por fecha descendente.",
    responses={**R_401, **R_403},
)
def listar_conversaciones(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verificar que el usuario solo acceda a sus propias conversaciones
    current_id = current_user.get("_usuario_id", "")
    if current_id != usuario_id:
        raise HTTPException(status_code=403, detail="No podés acceder a las conversaciones de otro usuario")

    import uuid as _uuid
    convs = (
        db.query(Conversacion)
        .filter(Conversacion.usuario_id == _uuid.UUID(usuario_id))
        .order_by(Conversacion.fijada.desc(), Conversacion.creado_en.desc())
        .all()
    )
    return [
        {
            "id": str(c.id),
            "titulo": c.titulo,
            "fijada": c.fijada,
            "creado_en": c.creado_en.isoformat(),
            "mensajes": [
                {
                    "pregunta": m.pregunta,
                    "respuesta": m.respuesta,
                    "confianza": round(m.puntaje_confianza, 3),
                    "creado_en": m.creado_en.isoformat(),
                }
                for m in sorted(c.mensajes, key=lambda x: x.creado_en)
            ],
        }
        for c in convs
    ]


@router.get(
    "/historial/usuario/{usuario_id}",
    summary="Últimas 5 consultas del usuario",
    responses={**R_401},
)
def obtener_historial(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    items = (
        db.query(HistorialChat)
        .filter(HistorialChat.usuario_id == usuario_id)
        .order_by(HistorialChat.creado_en.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "id": str(h.id),
            "pregunta": h.pregunta,
            "respuesta": h.respuesta,
            "confianza": round(h.puntaje_confianza, 3),
            "creado_en": h.creado_en.isoformat(),
        }
        for h in items
    ]
