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
from app.services.memoria_service import obtener_memoria, actualizar_memoria
from app.services.cache_service import buscar_en_cache, guardar_en_cache
from app.services.embedding_service import generate_query_embedding

import re as _re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])

PATRON_FECHA_HORA = _re.compile(
    r'\b(qu[eé]\s+d[ií]a|hoy|fecha|hora|d[ií]a\s+de\s+hoy|feriado|feriados|calendario|qu[eé]\s+hora|cu[aá]ndo|esta\s+semana|pr[oó]xim)\b',
    _re.IGNORECASE
)

def _es_pregunta_fecha(texto: str) -> bool:
    return bool(PATRON_FECHA_HORA.search(texto))


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
            # Cargar memoria e historial ANTES del loop para enriquecer la búsqueda
            db_mem = SessionLocal()
            try:
                memoria = obtener_memoria(db_mem, usuario_id)
                historial = [
                    {"pregunta": m.pregunta, "respuesta": m.respuesta}
                    for m in db_mem.query(HistorialChat)
                    .filter(HistorialChat.usuario_id == usuario_id)
                    .order_by(HistorialChat.creado_en.desc())
                    .limit(5)
                    .all()
                ][::-1]
            finally:
                db_mem.close()

            # Enriquecer la pregunta con contexto del historial para el loop RAG
            pregunta_enriquecida = request.mensaje
            if historial:
                ultima = historial[-1]
                # Si la pregunta es corta o referencial, agregar contexto de la última pregunta
                palabras = request.mensaje.strip().split()
                es_referencial = len(palabras) <= 8 or any(
                    p in request.mensaje.lower()
                    for p in ['solo', 'dame', 'muéstrame', 'cuáles', 'cuales', 'los de', 'las de', 'más', 'mas', 'también', 'tambien', 'ahora']
                )
                if es_referencial:
                    pregunta_enriquecida = f"{ultima['pregunta']} — {request.mensaje}"

            # Preguntas de fecha/hora/feriados — responder directo desde system prompt
            embedding_pregunta = None
            cache_hit = None
            if _es_pregunta_fecha(request.mensaje):
                resultado = type('R', (), {'nivel': 0, 'contexto': '', 'tipo_respuesta': 'local'})()
                resultados, max_score = [], 1.0
            else:
                # FASE 6 — Caché Semántico: buscar solo con pregunta original (no enriquecida)
                db_cache = SessionLocal()
                try:
                    embedding_pregunta = generate_query_embedding(request.mensaje)
                    cache_hit = buscar_en_cache(db_cache, embedding_pregunta)
                except Exception:
                    pass
                finally:
                    db_cache.close()

                if cache_hit:
                    logger.info(f"[CHAT] Cache HIT — respondiendo desde caché")
                    yield f"data: {json.dumps({'tipo': 'chunk', 'texto': cache_hit.respuesta})}\n\n"
                    yield f"data: {json.dumps({'tipo': 'final', 'consulta_id': consulta_id, 'fuentes': [], 'confianza': 1.0, 'tipo_respuesta': cache_hit.tipo_respuesta, 'nivel': cache_hit.nivel})}\n\n"
                    return

                try:
                    resultados, max_score = buscar_contexto(pregunta_enriquecida)
                except Exception as e:
                    logger.warning(f"[CHAT] Error Qdrant: {type(e).__name__}: {e}")
                    resultados, max_score = [], 0.0
                resultado = ejecutar_loop_retroalimentacion(pregunta_enriquecida, max_score, resultados)

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
                notificar_admin_sync(f"nivel{resultado.nivel}_externo", {
                    "pregunta": request.mensaje,
                    "usuario_id": usuario_id,
                    "score": round(max_score, 3),
                    "mensaje": f"Respuesta obtenida de fuente externa (Nivel {resultado.nivel}). Considerar agregar documentación oficial.",
                })

            respuesta_completa = []
            for texto in generar_respuesta_stream(request.mensaje, resultado.contexto, tipo=resultado.tipo_respuesta, memoria=memoria, historial=historial):
                respuesta_completa.append(texto)
                yield f"data: {json.dumps({'tipo': 'chunk', 'texto': texto})}\n\n"

            respuesta_texto = "".join(respuesta_completa)
            historial_id = guardar_historial(
                usuario_id=usuario_id,
                query=request.mensaje,
                answer=respuesta_texto,
                confidence_score=max_score,
                is_fallback=resultado.nivel > 0,
                conversacion_id=conversacion_id,
            )

            # Actualizar memoria persistente del usuario
            db_mem2 = SessionLocal()
            try:
                actualizar_memoria(db_mem2, usuario_id, request.mensaje, respuesta_texto)
            finally:
                db_mem2.close()

            # FASE 6 — Guardar en caché si la respuesta es de calidad (solo preguntas no referenciales)
            if resultado.nivel in (0, 1) and embedding_pregunta and pregunta_enriquecida == request.mensaje:
                db_cache2 = SessionLocal()
                try:
                    guardar_en_cache(db_cache2, pregunta_enriquecida, embedding_pregunta, respuesta_texto, resultado.tipo_respuesta, resultado.nivel)
                finally:
                    db_cache2.close()

            if max_score < UMBRAL_TICKET:
                db_t = SessionLocal()
                try:
                    crear_ticket(db_t, pregunta=request.mensaje, usuario_id=usuario_id, puntaje=max_score, nivel=resultado.nivel)
                finally:
                    db_t.close()

            db_val = SessionLocal()
            try:
                val = crear_validacion(db_val, pregunta=request.mensaje, respuesta=respuesta_texto, puntaje=max_score, fuente="usuario")
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
                docs_reales = [r for r in resultados if r.get("source_url", "")]
                if not docs_reales:
                    from app.models.models import Documento
                    import uuid as _uuid
                    db_f = SessionLocal()
                    try:
                        for r in resultados:
                            doc_id = r.get("document_id", "")
                            # Saltar validaciones indexadas (document_id no es UUID)
                            try:
                                _uuid.UUID(doc_id)
                            except (ValueError, AttributeError):
                                continue
                            nombre = r.get("titulo", "") or "Documento oficial"
                            if nombre not in vistos:
                                doc = db_f.query(Documento).filter(Documento.id == doc_id).first()
                                url = doc.url_fuente if doc else f"/v1/admin/ingesta/ver/{doc_id}"
                                titulo = doc.titulo if doc else nombre
                                vistos.add(titulo)
                                fuentes.append({"nombre": titulo, "url": url, "pagina": r.get("page_number", 0)})
                    finally:
                        db_f.close()
                else:
                    for r in docs_reales:
                        url = r.get("source_url", "")
                        nombre = r.get("titulo") or url.split("/")[-1] or "Documento oficial"
                        if nombre not in vistos:
                            vistos.add(nombre)
                            fuentes.append({"nombre": nombre, "url": url, "pagina": r.get("page_number", 0)})
            elif resultado.nivel in (1, 2) and resultado.contexto:
                import re
                urls = re.findall(r'\[Fuente(?:[^:]*): ([^\]]+)\]', resultado.contexto)
                vistos = set()
                for url in urls:
                    url = url.strip()
                    if url not in vistos:
                        vistos.add(url)
                        fuentes.append({"nombre": url, "url": url, "pagina": None})

            yield f"data: {json.dumps({'tipo': 'final', 'consulta_id': historial_id or consulta_id, 'fuentes': fuentes, 'confianza': round(max_score, 3), 'tipo_respuesta': resultado.tipo_respuesta, 'nivel': resultado.nivel})}\n\n"

        except (ValueError, RuntimeError, ConnectionError) as e:
            logger.error(f"[CHAT] Error: {e}")
            yield f"data: {json.dumps({'tipo': 'error', 'mensaje': str(e)})}\n\n"
        except Exception as e:
            logger.error(f"[CHAT] Error inesperado: {type(e).__name__}: {e}")
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
            for texto in generar_respuesta_stream(request.mensaje, resultado.contexto, tipo=resultado.tipo_respuesta):
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
