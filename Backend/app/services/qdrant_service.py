from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.core.settings import settings

client = QdrantClient(url=settings.qdrant_url)
COLLECTION = settings.qdrant_collection
VECTOR_SIZE = 3072  # gemini-embedding-001 genera vectores de 3072 dimensiones


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
            "titulo": r.payload.get("titulo", ""),
            "page_number": r.payload.get("page_number", 0),
            "score": r.score,
        }
        for r in results
    ]


def upsert(points: list[PointStruct]):
    """Inserta o actualiza vectores en la colección."""
    if not points:
        return
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i:i + batch_size]
        client.upsert(collection_name=COLLECTION, points=batch)


def eliminar_por_documento(document_id: str) -> None:
    """Elimina todos los vectores de un documento de Qdrant."""
    client.delete(
        collection_name=COLLECTION,
        points_selector=Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        ),
    )
