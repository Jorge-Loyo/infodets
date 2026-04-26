import httpx
import logging
from app.core.settings import settings
from app.services.embedding_service import generate_query_embedding
from app.services.qdrant_service import search

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.0-flash-lite"
API_BASE = "https://generativelanguage.googleapis.com/v1beta"
CONFIDENCE_THRESHOLD = 0.7

SYSTEM_PROMPT = """Eres un asistente oficial del sistema INFODETS para una entidad pública.
Tu función es responder consultas basándote EXCLUSIVAMENTE en la documentación oficial proporcionada.
Reglas:
1. Si la respuesta está en el contexto, responde con precisión citando la fuente.
2. Si la información no está en el contexto, indica claramente que no tienes documentación oficial sobre ese tema.
3. Nunca inventes información. La precisión legal es crítica.
4. Responde siempre en español."""


def buscar_contexto(pregunta: str, limit: int = 5) -> tuple[list[dict], float]:
    """
    Busca los chunks más relevantes en Qdrant para la pregunta dada.
    Retorna los resultados y el score máximo de confianza.
    """
    logger.info(f"[RAG] Buscando contexto para: {pregunta[:80]}...")
    vector = generate_query_embedding(pregunta)
    resultados = search(vector, limit=limit)
    max_score = max((r["score"] for r in resultados), default=0.0)
    logger.info(f"[RAG] {len(resultados)} chunks encontrados — score máximo: {max_score:.3f}")
    return resultados, max_score


def construir_contexto(resultados: list[dict]) -> str:
    """Construye el texto de contexto a partir de los chunks encontrados."""
    if not resultados:
        return ""
    partes = []
    for i, r in enumerate(resultados):
        partes.append(f"[Fuente {i+1}: {r.get('source_url', 'N/A')}]\n{r['text']}")
    return "\n\n---\n\n".join(partes)


def generar_respuesta(pregunta: str, contexto: str, is_fallback: bool = False) -> str:
    """
    Genera una respuesta usando Gemini con el contexto RAG.
    Si is_fallback=True agrega advertencia de fuente externa.
    """
    if is_fallback or not contexto:
        prompt = f"""{SYSTEM_PROMPT}

ADVERTENCIA: No se encontró documentación oficial sobre este tema en la base de datos.
La siguiente respuesta proviene de conocimiento general y NO es una fuente oficial verificada.

Pregunta: {pregunta}"""
    else:
        prompt = f"""{SYSTEM_PROMPT}

DOCUMENTACIÓN OFICIAL DISPONIBLE:
{contexto}

Pregunta del usuario: {pregunta}

Responde basándote únicamente en la documentación oficial proporcionada arriba."""

    url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
    }
    response = httpx.post(
        url,
        json=payload,
        params={"key": settings.gemini_generation_key or settings.gemini_api_key},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


def generar_respuesta_stream(pregunta: str, contexto: str, is_fallback: bool = False):
    """
    Genera respuesta en streaming usando Gemini SSE.
    Yields chunks de texto a medida que llegan.
    """
    if is_fallback or not contexto:
        prompt = f"""{SYSTEM_PROMPT}

ADVERTENCIA: No se encontró documentación oficial sobre este tema.
La siguiente respuesta proviene de conocimiento general y NO es una fuente oficial verificada.

Pregunta: {pregunta}"""
    else:
        prompt = f"""{SYSTEM_PROMPT}

DOCUMENTACIÓN OFICIAL DISPONIBLE:
{contexto}

Pregunta del usuario: {pregunta}

Responde basándote únicamente en la documentación oficial proporcionada arriba."""

    url = f"{API_BASE}/models/{GEMINI_MODEL}:streamGenerateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
    }

    with httpx.stream(
        "POST",
        url,
        json=payload,
        params={"key": settings.gemini_generation_key or settings.gemini_api_key, "alt": "sse"},
        timeout=60,
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]":
                    break
                try:
                    import json
                    chunk = json.loads(data)
                    text = chunk["candidates"][0]["content"]["parts"][0]["text"]
                    if text:
                        yield text
                except Exception:
                    continue
