import uuid
import logging
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import PointStruct
from app.services.embedding_service import generate_embeddings_batch
from app.services.qdrant_service import init_collection, upsert

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def extraer_texto_pdf(ruta_archivo: str) -> str:
    """Extrae el texto completo de un PDF."""
    reader = PdfReader(ruta_archivo)
    texto = ""
    for page in reader.pages:
        texto += page.extract_text() or ""
    return texto


def fragmentar_texto(texto: str) -> list[str]:
    """Divide el texto en chunks con overlap."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
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
    Pipeline completo de ingesta:
    1. Extrae texto del PDF
    2. Fragmenta en chunks
    3. Genera embeddings con Google text-embedding-004
    4. Almacena vectores en Qdrant
    Retorna la cantidad de chunks procesados.
    """
    init_collection()

    texto = extraer_texto_pdf(ruta_archivo)
    if not texto.strip():
        raise ValueError("El PDF no contiene texto extraible")

    chunks = fragmentar_texto(texto)
    if not chunks:
        raise ValueError("No se pudieron generar chunks del documento")

    logger.info(f"[INGESTA] Documento: {titulo} | Chunks a procesar: {len(chunks)}")

    logger.info(f"[INGESTA] Generando embeddings en batch...")
    vectors = generate_embeddings_batch(chunks)

    points = []
    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": chunk,
                    "document_id": document_id,
                    "source_url": source_url,
                    "titulo": titulo,
                    "page_number": i,
                },
            )
        )

    logger.info(f"[INGESTA] Guardando {len(points)} vectores en Qdrant...")
    upsert(points)
    logger.info(f"[INGESTA] ✅ Completado — {len(chunks)} chunks almacenados")
    return len(chunks)
