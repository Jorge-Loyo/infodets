from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.settings import settings

client = QdrantClient(url=settings.qdrant_url)
COLLECTION = settings.qdrant_collection
VECTOR_SIZE = 768  # dimensión estándar para embeddings


def init_collection():
    """Crea la colección si no existe."""
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION not in existing:
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def search(vector: list[float], limit: int = 5) -> list[dict]:
    """Busca los chunks más similares al vector dado."""
    results = client.search(
        collection_name=COLLECTION,
        query_vector=vector,
        limit=limit,
    )
    return [
        {
            "text": r.payload.get("text", ""),
            "document_id": r.payload.get("document_id", ""),
            "source_url": r.payload.get("source_url", ""),
            "page_number": r.payload.get("page_number", 0),
            "score": r.score,
        }
        for r in results
    ]


def upsert(points: list[PointStruct]):
    """Inserta o actualiza vectores en la colección."""
    client.upsert(collection_name=COLLECTION, points=points)
