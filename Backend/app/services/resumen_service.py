import logging
from groq import Groq
from app.core.settings import settings

logger = logging.getLogger(__name__)


def generar_resumen(texto: str, titulo: str) -> str:
    """Genera un resumen del documento usando Groq (rápido y sin costo extra)."""
    try:
        client = Groq(api_key=settings.groq_api_key)
        # Tomar los primeros 4000 chars para el resumen
        fragmento = texto[:4000]
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generá un resumen conciso en español (máximo 3 oraciones) del siguiente documento oficial. "
                        "Incluí: qué tipo de documento es, su propósito principal, y a quién aplica. "
                        "Respondé SOLO con el resumen, sin introducción ni explicación."
                    ),
                },
                {"role": "user", "content": f"Título: {titulo}\n\nContenido:\n{fragmento}"},
            ],
            temperature=0.2,
            max_tokens=200,
        )
        resumen = resp.choices[0].message.content or ""
        logger.info(f"[RESUMEN] Generado para '{titulo}': {resumen[:80]}...")
        return resumen.strip()
    except Exception as e:
        logger.warning(f"[RESUMEN] Error generando resumen: {e}")
        return ""
