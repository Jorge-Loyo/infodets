import json
import uuid
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.schemas.chat_schema import ChatRequest
from app.services.rag_service import (
    buscar_contexto,
    construir_contexto,
    generar_respuesta_stream,
    CONFIDENCE_THRESHOLD,
)
from app.services.chat_service import guardar_historial
from app.services.ticket_service import crear_ticket, UMBRAL_TICKET
from app.middleware.auth_middleware import get_current_user
from app.core.database import get_db, SessionLocal
from app.models.models import HistorialChat
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    consulta_id = str(uuid.uuid4())
    usuario_id = current_user.get("_cognito_sub", "") or request.usuario_id

    def generate():
        try:
            resultados, max_score = buscar_contexto(request.mensaje)
            is_fallback = max_score < CONFIDENCE_THRESHOLD
            tipo_respuesta = "local" if not is_fallback else "fallback"

            logger.info(f"[CHAT] consulta_id={consulta_id} | score={max_score:.3f} | tipo={tipo_respuesta}")

            if is_fallback:
                aviso = json.dumps({
                    "tipo": "chunk",
                    "texto": "⚠️ No encontré documentación oficial sobre este tema. La siguiente respuesta es de conocimiento general y no está verificada oficialmente.\n\n"
                })
                yield f"data: {aviso}\n\n"

            contexto = construir_contexto(resultados)
            respuesta_completa = []
            for texto in generar_respuesta_stream(request.mensaje, contexto, is_fallback):
                respuesta_completa.append(texto)
                chunk = json.dumps({"tipo": "chunk", "texto": texto})
                yield f"data: {chunk}\n\n"

            # Guardar historial
            guardar_historial(
                usuario_id=request.usuario_id,
                query=request.mensaje,
                answer="".join(respuesta_completa),
                confidence_score=max_score,
                is_fallback=is_fallback,
            )

            # Ticket silencioso al admin si score < 0.3
            if max_score < UMBRAL_TICKET:
                db = SessionLocal()
                try:
                    crear_ticket(db, pregunta=request.mensaje, usuario_id=usuario_id, puntaje=max_score)
                finally:
                    db.close()

            fuentes = [
                {
                    "nombre": r.get("titulo") or r.get("source_url", "").split("/")[-1] or "Documento oficial",
                    "url": r.get("source_url", ""),
                    "pagina": r.get("page_number", 0),
                }
                for r in resultados
                if r.get("source_url", "").startswith("/v1/")  # solo URLs del nuevo sistema
            ]
            # Deduplicar por nombre
            vistos = set()
            fuentes_unicas = []
            for f in fuentes:
                if f["nombre"] not in vistos:
                    vistos.add(f["nombre"])
                    fuentes_unicas.append(f)
            fuentes = fuentes_unicas
            final = json.dumps({
                "tipo": "final",
                "consulta_id": consulta_id,
                "fuentes": fuentes,
                "confianza": round(max_score, 3),
                "tipo_respuesta": tipo_respuesta,
            })
            yield f"data: {final}\n\n"

        except (ValueError, RuntimeError, ConnectionError) as e:
            logger.error(f"[CHAT] Error: {e}")
            error = json.dumps({"tipo": "error", "mensaje": str(e)})
            yield f"data: {error}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/historial/usuario/{usuario_id}")
def obtener_historial(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    items = db.query(HistorialChat).filter(
        HistorialChat.usuario_id == usuario_id
    ).order_by(HistorialChat.creado_en.desc()).limit(20).all()
    return [
        {
            "id": str(h.id),
            "pregunta": h.pregunta,
            "creado_en": h.creado_en.isoformat(),
        }
        for h in items
    ]
