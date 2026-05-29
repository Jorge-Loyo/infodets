import uuid
import logging
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import PointStruct
from app.services.embedding_service import generate_embeddings_batch
from app.services.qdrant_service import init_collection, upsert

logger = logging.getLogger(__name__)

# Chunks más grandes para reducir cantidad total en documentos largos
CHILD_CHUNK_SIZE = 500
CHILD_CHUNK_OVERLAP = 50
PARENT_CHUNK_SIZE = 1500
PARENT_CHUNK_OVERLAP = 150


def extraer_texto_pdf(ruta_archivo: str) -> str:
    try:
        reader = PdfReader(ruta_archivo)
        texto = ""
        for page in reader.pages:
            texto += page.extract_text() or ""
        return texto
    except Exception as e:
        raise ValueError(f"No se pudo leer el PDF: {e}")


def fragmentar_texto(texto: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "],
    )
    return splitter.split_text(texto)


async def procesar_documento(
    ruta_archivo: str,
    document_id: str,
    source_url: str,
    titulo: str,
    metadatos: dict | None = None,
) -> int:
    """
    Pipeline de ingesta con Parent-Child Retrieval:
    1. Extrae texto del PDF
    2. Genera chunks padre (grandes, para contexto)
    3. Genera chunks hijo (medianos, para búsqueda) con referencia al padre
    4. Indexa los chunks hijo en Qdrant con el texto del padre en el payload
    Soporta documentos de hasta 300+ páginas.
    """
    init_collection()

    texto = extraer_texto_pdf(ruta_archivo)
    if not texto.strip():
        raise ValueError("El PDF no contiene texto extraible")

    logger.info(f"[INGESTA] {titulo} | Texto extraído: {len(texto)} caracteres")

    # Construir texto enriquecido con metadatos para mejorar búsqueda
    meta = metadatos or {}
    meta_texto = f"Título: {titulo}"
    if meta.get("nro_resolucion"):
        meta_texto += f" | Resolución N° {meta['nro_resolucion']}"
    if meta.get("nro_decreto"):
        meta_texto += f" | Decreto N° {meta['nro_decreto']}"
    if meta.get("categoria"):
        meta_texto += f" | Categoría: {meta['categoria']}"
    if meta.get("descripcion"):
        meta_texto += f" | {meta['descripcion']}"

    # Generar chunks padre
    chunks_padre = fragmentar_texto(texto, PARENT_CHUNK_SIZE, PARENT_CHUNK_OVERLAP)
    if not chunks_padre:
        raise ValueError("No se pudieron generar chunks del documento")

    logger.info(f"[INGESTA] {titulo} | Chunks padre: {len(chunks_padre)}")

    # Generar chunks hijo por cada padre
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHILD_CHUNK_SIZE,
        chunk_overlap=CHILD_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " "],
    )

    chunks_hijo = []
    textos_padre = []
    indices_padre = []

    for i, padre in enumerate(chunks_padre):
        hijos = child_splitter.split_text(padre)
        for hijo in hijos:
            chunks_hijo.append(hijo)
            textos_padre.append(padre)
            indices_padre.append(i)

    logger.info(f"[INGESTA] {titulo} | Chunks hijo: {len(chunks_hijo)}")

    # Generar embeddings en lotes
    # Prepend metadatos al texto de cada chunk hijo para mejorar relevancia
    chunks_para_embedding = [f"{meta_texto}\n{hijo}" for hijo in chunks_hijo]
    logger.info(f"[INGESTA] Generando embeddings ({len(chunks_hijo)} chunks)...")
    vectors = generate_embeddings_batch(chunks_para_embedding)

    # Indexar en Qdrant en lotes de 50 puntos
    points = []
    for i, (hijo, vector, padre, idx_padre) in enumerate(zip(chunks_hijo, vectors, textos_padre, indices_padre)):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": padre,
                    "text_hijo": hijo,
                    "document_id": document_id,
                    "source_url": source_url,
                    "titulo": titulo,
                    "page_number": idx_padre,
                    "categoria": meta.get("categoria", ""),
                    "nro_resolucion": meta.get("nro_resolucion", ""),
                    "nro_decreto": meta.get("nro_decreto", ""),
                    "autor": meta.get("autor", ""),
                    "descripcion": meta.get("descripcion", ""),
                },
            )
        )

    logger.info(f"[INGESTA] Guardando {len(points)} vectores en Qdrant...")
    upsert(points)
    logger.info(f"[INGESTA] ✅ Completado — {len(chunks_hijo)} chunks indexados")
    return len(chunks_hijo)
