import google.generativeai as genai
from app.core.settings import settings

genai.configure(api_key=settings.gemini_api_key)

EMBEDDING_MODEL = "models/text-embedding-004"
VECTOR_SIZE = 768


def generate_embedding(text: str) -> list[float]:
    """Genera un embedding para un texto usando Google text-embedding-004."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


def generate_query_embedding(query: str) -> list[float]:
    """Genera un embedding para una consulta del usuario."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=query,
        task_type="retrieval_query",
    )
    return result["embedding"]
