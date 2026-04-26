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
from app.middleware.auth_middleware import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    RF2 — Chat con IA usando RAG + Gemini streaming.
    Flujo:
    1. Genera embedding de la pregunta
    2. Busca chunks relevantes en Qdrant
    3. Si confianza > 70% → responde con documentación oficial
    4. Si confianza < 70% → respuesta cautelosa con advertencia
    5. Envía chunks de texto via SSE al Front-End
    6. Al finalizar guarda historial en RDS y envía las fuentes
    """
    consulta_id = str(uuid.uuid4())

    def generate():
        try:
            # 1. Buscar contexto en Qdrant
            resultados, max_score = buscar_contexto(request.mensaje)
            is_fallback = max_score < CONFIDENCE_THRESHOLD
            tipo_respuesta = "local" if not is_fallback else "fallback"

            logger.info(f"[CHAT] consulta_id={consulta_id} | score={max_score:.3f} | tipo={tipo_respuesta}")

            # 2. Si es fallback, avisar al Front-End
            if is_fallback:
                aviso = json.dumps({
                    "tipo": "chunk",
                    "texto": "⚠️ No encontré documentación oficial sobre este tema. La siguiente respuesta es de conocimiento general y no está verificada oficialmente.\n\n"
                })
                yield f"data: {aviso}\n\n"

            # 3. Construir contexto y streamear respuesta acumulando el texto completo
            contexto = construir_contexto(resultados)
            respuesta_completa = []
            for texto in generar_respuesta_stream(request.mensaje, contexto, is_fallback):
                respuesta_completa.append(texto)
                chunk = json.dumps({"tipo": "chunk", "texto": texto})
                yield f"data: {chunk}\n\n"

            # 4. Guardar historial en RDS (falla silenciosamente si tablas no existen aún)
            guardar_historial(
                usuario_id=request.usuario_id,
                query=request.mensaje,
                answer="".join(respuesta_completa),
                confidence_score=max_score,
                is_fallback=is_fallback,
            )

            # 5. Enviar evento final con fuentes
            fuentes = [
                {
                    "nombre": r.get("titulo", "Documento oficial"),
                    "url": r.get("source_url", ""),
                    "pagina": r.get("page_number", 0),
                }
                for r in resultados
            ]
            final = json.dumps({
                "tipo": "final",
                "consulta_id": consulta_id,
                "fuentes": fuentes,
                "confianza": round(max_score, 3),
                "tipo_respuesta": tipo_respuesta,
            })
            yield f"data: {final}\n\n"

        except Exception as e:
            logger.error(f"[CHAT] Error: {e}")
            error = json.dumps({"tipo": "error", "mensaje": str(e)})
            yield f"data: {error}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
