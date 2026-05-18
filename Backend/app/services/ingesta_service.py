import uuid
import logging
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import PointStruct
from app.services.embedding_service import generate_embeddings_batch
from app.services.qdrant_service import init_collection, upsert

logger = logging.getLogger(__name__)

# FASE 5 — Parent-Child Retrieval
# Chunks hijo: pequeños, para búsqueda precisa en Qdrant
# Chunks padre: grandes, para contexto completo al LLM
CHILD_CHUNK_SIZE = 300
CHILD_CHUNK_OVERLAP = 50
PARENT_CHUNK_SIZE = 1000
PARENT_CHUNK_OVERLAP = 100


def extraer_texto_pdf(ruta_archivo: str) -> str:
    reader = PdfReader(ruta_archivo)
    texto = ""
    for page in reader.pages:
        texto += page.extract_text() or ""
    return texto


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
) -> int:
    """
    Pipeline de ingesta con Parent-Child Retrieval (Fase 5):
    1. Extrae texto del PDF
    2. Genera chunks padre (grandes, para contexto)
    3. Genera chunks hijo (pequeños, para búsqueda) con referencia al padre
    4. Indexa SOLO los chunks hijo en Qdrant con el texto del padre en el payload
    Retorna la cantidad de chunks hijo procesados.
    """
    init_collection()

    texto = extraer_texto_pdf(ruta_archivo)
    if not texto.strip():
        raise ValueError("El PDF no contiene texto extraible")

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

    chunks_hijo = []       # texto del hijo (para embedding)
    textos_padre = []      # texto del padre correspondiente (para contexto al LLM)
    indices_padre = []     # índice del padre para page_number

    for i, padre in enumerate(chunks_padre):
        hijos = child_splitter.split_text(padre)
        for hijo in hijos:
            chunks_hijo.append(hijo)
            textos_padre.append(padre)
            indices_padre.append(i)

    logger.info(f"[INGESTA] {titulo} | Chunks hijo: {len(chunks_hijo)}")

    # Generar embeddings de los chunks hijo (búsqueda precisa)
    logger.info(f"[INGESTA] Generando embeddings en batch...")
    vectors = generate_embeddings_batch(chunks_hijo)

    # Indexar chunks hijo con texto del padre en el payload
    points = []
    for i, (hijo, vector, padre, idx_padre) in enumerate(zip(chunks_hijo, vectors, textos_padre, indices_padre)):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": padre,          # LLM recibe el chunk PADRE (más contexto)
                    "text_hijo": hijo,      # texto del hijo (para debug)
                    "document_id": document_id,
                    "source_url": source_url,
                    "titulo": titulo,
                    "page_number": idx_padre,
                },
            )
        )

    logger.info(f"[INGESTA] Guardando {len(points)} vectores en Qdrant...")
    upsert(points)
    logger.info(f"[INGESTA] ✅ Completado — {len(chunks_hijo)} chunks hijo indexados con {len(chunks_padre)} chunks padre")
    return len(chunks_hijo)
