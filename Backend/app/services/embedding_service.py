import httpx
import logging
from app.core.settings import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "gemini-embedding-001"
VECTOR_SIZE = 3072
API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def generate_embeddings_batch(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """
    Genera embeddings para múltiples textos en una sola llamada API.
    Mucho más eficiente que llamar una vez por chunk.
    """
    url = f"{API_BASE}/models/{EMBEDDING_MODEL}:batchEmbedContents"
    requests_payload = [
        {
            "model": f"models/{EMBEDDING_MODEL}",
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
        }
        for text in texts
    ]
    payload = {"requests": requests_payload}

    logger.info(f"[EMBEDDING] Enviando batch de {len(texts)} textos a Google...")
    response = httpx.post(
        url,
        json=payload,
        params={"key": settings.gemini_api_key},
        timeout=120,
    )
    response.raise_for_status()
    embeddings = response.json()["embeddings"]
    logger.info(f"[EMBEDDING] ✅ Batch completado — {len(embeddings)} embeddings recibidos")
    return [e["values"] for e in embeddings]


def generate_embedding(text: str) -> list[float]:
    """Genera un embedding para un solo texto."""
    return generate_embeddings_batch([text])[0]


def generate_query_embedding(query: str) -> list[float]:
    """Genera un embedding para una consulta del usuario."""
    url = f"{API_BASE}/models/{EMBEDDING_MODEL}:embedContent"
    payload = {
        "model": f"models/{EMBEDDING_MODEL}",
        "content": {"parts": [{"text": query}]},
        "taskType": "RETRIEVAL_QUERY",
    }
    response = httpx.post(
        url,
        json=payload,
        params={"key": settings.gemini_api_key},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["embedding"]["values"]
