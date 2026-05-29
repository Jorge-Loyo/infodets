import logging
import cohere
from app.core.settings import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "embed-multilingual-v3.0"
VECTOR_SIZE = 1024

_client = cohere.ClientV2(api_key=settings.cohere_api_key)


def generate_embeddings_batch(texts: list[str], task_type: str = "search_document", batch_size: int = 96) -> list[list[float]]:
    """
    Genera embeddings usando Cohere embed-multilingual-v3.0 (producción).
    Sin rate limits prácticos. PDFs de 300 páginas en ~15-30 segundos.
    """
    texts = [t if t.strip() else " " for t in texts]
    all_embeddings = []
    total_lotes = (len(texts) + batch_size - 1) // batch_size

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        lote_num = i // batch_size + 1
        logger.info(f"[EMBEDDING] Lote {lote_num}/{total_lotes} ({len(batch)} textos)...")

        response = _client.embed(
            texts=batch,
            model=EMBEDDING_MODEL,
            input_type=task_type,
            embedding_types=["float"],
        )
        all_embeddings.extend(response.embeddings.float_)

    logger.info(f"[EMBEDDING] ✅ {len(all_embeddings)} embeddings generados")
    return all_embeddings


def generate_embedding(text: str) -> list[float]:
    """Genera un embedding para un solo texto."""
    return generate_embeddings_batch([text])[0]


def generate_query_embedding(query: str) -> list[float]:
    """Genera un embedding para una consulta del usuario."""
    return generate_embeddings_batch([query], task_type="search_query")[0]
