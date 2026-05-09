import httpx
import logging
from datetime import datetime
from groq import Groq
from app.core.settings import settings
from app.services.embedding_service import generate_query_embedding
from app.services.qdrant_service import search

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.0-flash-lite"
GROQ_MODEL = "llama-3.3-70b-versatile"
API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Umbrales del Loop de Retroalimentación
CONFIDENCE_THRESHOLD = 0.70   # < 70% activa fallback escalonado
UMBRAL_NIVEL2 = 0.0           # si nivel 1 también falla, activa búsqueda web

SYSTEM_PROMPT = """Eres un asistente oficial del sistema INFODETS para una entidad pública.
Tu función es responder consultas basándote EXCLUSIVAMENTE en la documentación oficial proporcionada.
Reglas:
1. Si la respuesta está en el contexto, responde con precisión citando la fuente.
2. Si la información no está en el contexto, indica claramente que no tienes documentación oficial sobre ese tema.
3. Nunca inventes información. La precisión legal es crítica.
4. Responde siempre en español."""

AVISO_FUENTE_EXTERNA = (
    "⚠️ He encontrado esta información en fuentes externas (no oficiales de esta oficina aún). "
    "Esta respuesta no representa documentación oficial verificada de la entidad.\n\n"
)

MENSAJE_ESCALAMIENTO = (
    "Lo sentimos, no hemos encontrado información oficial ni en fuentes externas sobre su consulta. "
    "Hemos generado un informe para que su consulta sea respondida a la brevedad posible por nuestro equipo. "
    "Le pedimos disculpas por los inconvenientes."
)


# ─── Nivel 0: Búsqueda local en Qdrant ───────────────────────────────────────

def buscar_contexto(pregunta: str, limit: int = 5) -> tuple[list[dict], float]:
    logger.info(f"[RAG] Buscando contexto para: {pregunta[:80]}...")
    vector = generate_query_embedding(pregunta)
    resultados = search(vector, limit=limit)
    max_score = max((r["score"] for r in resultados), default=0.0)
    logger.info(f"[RAG] {len(resultados)} chunks — score máximo: {max_score:.3f}")
    return resultados, max_score


def construir_contexto(resultados: list[dict]) -> str:
    if not resultados:
        return ""
    return "\n\n---\n\n".join(
        f"[Fuente {i+1}: {r.get('source_url', 'N/A')}]\n{r['text']}"
        for i, r in enumerate(resultados)
    )


# ─── Nivel 1: Búsqueda en URLs oficiales predefinidas ────────────────────────

def buscar_en_urls_oficiales(pregunta: str) -> str:
    """Extrae texto de las URLs oficiales activas en la DB."""
    from app.core.database import SessionLocal
    from app.services.url_service import get_urls_activas
    db = SessionLocal()
    try:
        urls = get_urls_activas(db)
    finally:
        db.close()

    if not urls:
        return ""
    textos = []
    for url in urls:
        try:
            resp = httpx.get(url, timeout=10, follow_redirects=True)
            if resp.status_code == 200:
                textos.append(f"[Fuente oficial: {url}]\n{resp.text[:3000]}")
        except Exception as e:
            logger.warning(f"[NIVEL1] Error al acceder {url}: {e}")
    return "\n\n---\n\n".join(textos)


# ─── Nivel 2: Búsqueda web via API ───────────────────────────────────────────

def buscar_en_web(pregunta: str) -> str:
    """Busca en internet usando la API de búsqueda configurada (Serper/Tavily)."""
    if not settings.search_api_key or not settings.search_api_url:
        return ""
    try:
        resp = httpx.post(
            settings.search_api_url,
            json={"q": pregunta, "num": 3},
            headers={"X-API-KEY": settings.search_api_key, "Content-Type": "application/json"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            resultados = data.get("organic", [])
            textos = [
                f"[Web: {r.get('link', '')}]\n{r.get('snippet', '')}"
                for r in resultados[:3]
            ]
            return "\n\n---\n\n".join(textos)
    except Exception as e:
        logger.warning(f"[NIVEL2] Error búsqueda web: {e}")
    return ""


# ─── Generación de respuesta ─────────────────────────────────────────────────

def _prompt(pregunta: str, contexto: str, tipo: str) -> str:
    # Cargar identidad del bot desde DB
    system = SYSTEM_PROMPT
    try:
        from app.core.database import SessionLocal
        from app.models.models import BotIdentidad
        from datetime import timezone, timedelta
        db = SessionLocal()
        bot = db.query(BotIdentidad).first()
        db.close()
        # Fecha y hora actual en Argentina (UTC-3)
        ar_tz = timezone(timedelta(hours=-3))
        ahora = datetime.now(ar_tz)
        fecha_hora = ahora.strftime('%A %d de %B de %Y, %H:%M hs (hora Argentina)')
        # Feriados del año actual desde API pública
        feriados_info = ""
        try:
            anio = ahora.year
            resp = httpx.get(f"https://nolaborables.com.ar/api/v2/feriados/{anio}", timeout=5)
            if resp.status_code == 200:
                feriados = resp.json()
                proximos = [
                    f for f in feriados
                    if f.get('mes', 0) > ahora.month or
                    (f.get('mes', 0) == ahora.month and f.get('dia', 0) >= ahora.day)
                ][:5]
                if proximos:
                    lista = ', '.join(
                        f"{f.get('dia'):02d}/{f.get('mes'):02d} — {f.get('motivo', '')}"
                        for f in proximos
                    )
                    feriados_info = f"\nPróximos feriados en Argentina: {lista}"
        except Exception:
            pass
        if bot:
            system = f"""Sos {bot.nombre}, asistente virtual{f' de {bot.institucion}' if bot.institucion else ''}.
{'Descripción: ' + bot.descripcion if bot.descripcion else ''}
Personalidad: {bot.personalidad or 'profesional y servicial'}.
Tono: {bot.tono}. Idioma: {bot.idioma}.
{'Restricciones: ' + bot.restricciones if bot.restricciones else ''}
País: Argentina | Zona horaria: America/Argentina/Buenos_Aires (UTC-3)
Fecha y hora actual: {fecha_hora}{feriados_info}
Tu función es responder consultas basándote EXCLUSIVAMENTE en la documentación oficial proporcionada.
Reglas:
1. Si la respuesta está en el contexto, respondé con precisión citando la fuente.
2. Si la información no está en el contexto, indicá claramente que no tenés documentación oficial sobre ese tema.
3. Nunca inventes información. La precisión legal es crítica.
4. Respondé siempre en {bot.idioma}.
5. EXCEPCIÓN: Para preguntas sobre fecha, hora, día, feriados, calendario o información general de Argentina, respondé usando los datos de contexto del sistema (fecha/hora/feriados) sin necesidad de documentación oficial."""
        else:
            system = f"""{SYSTEM_PROMPT}
País: Argentina | Zona horaria: America/Argentina/Buenos_Aires (UTC-3)
Fecha y hora actual: {fecha_hora}{feriados_info}
EXCEPCIÓN: Para preguntas sobre fecha, hora, día, feriados o calendario, respondé usando los datos de contexto del sistema sin necesidad de documentación oficial."""
    except Exception:
        pass
    except Exception:
        pass
    if tipo == "local":
        return f"""{system}

DOCUMENTACIÓN OFICIAL DISPONIBLE:
{contexto}

Pregunta del usuario: {pregunta}

Respondé basándote únicamente en la documentación oficial proporcionada arriba."""

    if tipo == "externo":
        return f"""{system}

INFORMACIÓN DE FUENTES EXTERNAS (no documentación oficial de la entidad):
{contexto}

Pregunta del usuario: {pregunta}

IMPORTANTE: Esta información proviene de fuentes externas. Indicá claramente que no es documentación oficial de la entidad."""

    return f"""{system}

ADVERTENCIA: No se encontró documentación oficial sobre este tema.
La siguiente respuesta proviene de conocimiento general y NO es una fuente oficial verificada.

Pregunta: {pregunta}"""


def generar_respuesta_stream(pregunta: str, contexto: str, is_fallback: bool = False):
    tipo = "fallback" if is_fallback or not contexto else "local"
    try:
        logger.info("[RAG] Intentando con Gemini...")
        yield from _generar_gemini_stream(pregunta, contexto, tipo)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logger.warning("[RAG] Gemini rate limit — usando Groq")
            yield from _generar_groq_stream(pregunta, contexto, tipo)
        else:
            raise
    except Exception as e:
        if "429" in str(e):
            logger.warning("[RAG] Gemini rate limit (exc) — usando Groq")
            yield from _generar_groq_stream(pregunta, contexto, tipo)
        else:
            raise


def _generar_gemini_stream(pregunta: str, contexto: str, tipo: str):
    prompt = _prompt(pregunta, contexto, tipo)
    url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
    }
    response = httpx.post(
        url, json=payload,
        params={"key": settings.gemini_generation_key or settings.gemini_api_key},
        timeout=60,
    )
    response.raise_for_status()
    text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    if text:
        yield text


def _generar_groq_stream(pregunta: str, contexto: str, tipo: str):
    prompt = _prompt(pregunta, contexto, tipo)
    client = Groq(api_key=settings.groq_api_key)
    stream = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=True, temperature=0.1, max_tokens=1024,
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text


# ─── Función principal del loop de retroalimentación ─────────────────────────

class ResultadoBusqueda:
    def __init__(self, nivel: int, contexto: str, tipo_respuesta: str):
        self.nivel = nivel          # 0=local, 1=urls, 2=web, 3=escalamiento
        self.contexto = contexto
        self.tipo_respuesta = tipo_respuesta  # local | externo | escalamiento


def ejecutar_loop_retroalimentacion(pregunta: str, max_score: float, resultados_qdrant: list[dict]) -> ResultadoBusqueda:
    """
    Ejecuta el loop de retroalimentación escalonado según el requerimiento.
    Retorna el nivel alcanzado y el contexto a usar.
    """
    # Nivel 0 — Qdrant local con confianza suficiente
    if max_score >= CONFIDENCE_THRESHOLD:
        return ResultadoBusqueda(0, construir_contexto(resultados_qdrant), "local")

    logger.info(f"[LOOP] Score {max_score:.3f} < {CONFIDENCE_THRESHOLD} — activando fallback escalonado")

    # Nivel 1 — URLs oficiales predefinidas
    contexto_nivel1 = buscar_en_urls_oficiales(pregunta)
    if contexto_nivel1:
        logger.info("[LOOP] Nivel 1: contexto encontrado en URLs oficiales")
        return ResultadoBusqueda(1, contexto_nivel1, "externo")

    # Nivel 2 — Búsqueda web
    contexto_nivel2 = buscar_en_web(pregunta)
    if contexto_nivel2:
        logger.info("[LOOP] Nivel 2: contexto encontrado en búsqueda web")
        return ResultadoBusqueda(2, contexto_nivel2, "externo")

    # Nivel 3 — Escalamiento humano
    logger.info("[LOOP] Nivel 3: escalamiento humano")
    return ResultadoBusqueda(3, "", "escalamiento")


# Mantener compatibilidad con código existente
def generar_respuesta(pregunta: str, contexto: str, is_fallback: bool = False) -> str:
    tipo = "fallback" if is_fallback or not contexto else "local"
    prompt = _prompt(pregunta, contexto, tipo)
    url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
    }
    response = httpx.post(
        url, json=payload,
        params={"key": settings.gemini_generation_key or settings.gemini_api_key},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]
