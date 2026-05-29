from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.core.settings import settings

client = QdrantClient(url=settings.qdrant_url, timeout=120)
COLLECTION = settings.qdrant_collection
VECTOR_SIZE = 1024  # Cohere embed-multilingual-v3.0


def init_collection():
    """Crea la colección si no existe o la recrea si cambió el tamaño del vector."""
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION in existing:
        info = client.get_collection(COLLECTION)
        current_size = info.config.params.vectors.size
        if current_size != VECTOR_SIZE:
            client.delete_collection(COLLECTION)
            existing.remove(COLLECTION)
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
