import logging
import json
from groq import Groq
from app.core.settings import settings

logger = logging.getLogger(__name__)


def analizar_documento(texto: str) -> dict:
    """
    Analiza el texto de un PDF y extrae metadatos automáticamente usando IA.
    Retorna: titulo, categoria, dependencia, anio, nro_resolucion, nro_decreto, autor, descripcion
    """
    try:
        client = Groq(api_key=settings.groq_api_key)
        fragmento = texto[:6000]
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """Analizá el siguiente documento oficial y extraé los metadatos en formato JSON.
Campos a extraer:
- "titulo": título del documento (string)
- "categoria": una de estas opciones EXACTAS: "Normativas", "Resoluciones", "Informes", "Decretos", "Comunicaciones", "Otros"
- "dependencia": organismo o área que emite el documento (string o null)
- "anio": año del documento (número o null)
- "nro_resolucion": número de resolución si existe (string o null, ej: "001-2024")
- "nro_decreto": número de decreto si existe (string o null, ej: "1990/97")
- "autor": autor o entidad que firma/emite (string o null)
- "descripcion": resumen de 2-3 oraciones sobre el contenido y propósito del documento

Respondé SOLO con el JSON válido, sin markdown ni explicaciones.""",
                },
                {"role": "user", "content": fragmento},
            ],
            temperature=0.1,
            max_tokens=500,
        )
        contenido = resp.choices[0].message.content or "{}"
        # Limpiar posible markdown
        contenido = contenido.strip()
        if contenido.startswith("```"):
            contenido = contenido.split("\n", 1)[1] if "\n" in contenido else contenido[3:]
            if contenido.endswith("```"):
                contenido = contenido[:-3]
            contenido = contenido.strip()

        resultado = json.loads(contenido)
        logger.info(f"[ANALISIS] Documento analizado: {resultado.get('titulo', 'sin título')}")
        return resultado
    except json.JSONDecodeError as e:
        logger.warning(f"[ANALISIS] Error parseando JSON: {e}")
        return {}
    except Exception as e:
        logger.warning(f"[ANALISIS] Error analizando documento: {e}")
        return {}
