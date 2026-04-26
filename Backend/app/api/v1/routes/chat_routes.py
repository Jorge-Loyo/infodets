from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.schemas.chat_schema import ChatRequest
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    RF2 — Interfaz de consulta con streaming SSE.
    Recibe la pregunta del usuario, consulta el RAG y devuelve
    la respuesta de Gemini en tiempo real chunk por chunk.
    Al finalizar envía las fuentes oficiales para validación legal.
    """
    async def generate():
        # TODO Sprint 3: implementar RAG + Gemini stream
        yield "data: {\"tipo\": \"chunk\", \"texto\": \"Endpoint listo para implementación\"}\n\n"
        yield "data: {\"tipo\": \"final\", \"consulta_id\": \"\", \"fuentes\": [], \"confianza\": 0.0, \"tipo_respuesta\": \"local\"}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
