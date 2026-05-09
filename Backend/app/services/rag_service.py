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
CONFIDENCE_THRESHOLD = 0.75   # < 75% activa fallback escalonado
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
    # Buscar más resultados para asegurar que haya docs reales entre los top
    resultados_raw = search(vector, limit=10)
    # Separar docs reales (con source_url) de validaciones indexadas
    docs_reales = [r for r in resultados_raw if r.get("source_url", "")]
    validaciones = [r for r in resultados_raw if not r.get("source_url", "")]
    # Priorizar docs reales, completar con validaciones si hacen falta
    resultados = (docs_reales + validaciones)[:limit]
    max_score = max((r["score"] for r in (docs_reales or resultados)), default=0.0)
    logger.info(f"[RAG] {len(resultados_raw)} chunks ({len(docs_reales)} docs reales) — score máximo: {max_score:.3f}")
    return resultados, max_score


def construir_contexto(resultados: list[dict]) -> str:
    if not resultados:
        return ""
    # Excluir validaciones indexadas (sin source_url) del contexto
    docs = [r for r in resultados if r.get("source_url", "")]
    if not docs:
        docs = resultados  # fallback: usar todos si no hay docs con URL
    return "\n\n---\n\n".join(
        f"[Fuente {i+1}: {r.get('source_url', 'N/A')}]\n{r['text']}"
        for i, r in enumerate(docs)
    )


# ─── Nivel 1: Búsqueda en URLs oficiales predefinidas ────────────────────────

UMBRAL_RELEVANCIA_NIVEL1 = 0.40  # mínimo 40% de palabras clave de la pregunta deben aparecer en el texto
STOPWORDS = {'cual', 'como', 'donde', 'quien', 'quién', 'cuál', 'cómo', 'dónde', 'para', 'este', 'esta', 'esto', 'esos', 'esas', 'tiene', 'sabe', 'sabes', 'sobre', 'del', 'los', 'las', 'una', 'uno', 'son', 'hay', 'fue', 'ser', 'sus', 'por', 'con', 'que', 'nombre'}


def _es_relevante(pregunta: str, texto: str) -> bool:
    """Verifica si el texto contiene suficientes palabras clave de la pregunta."""
    import re
    palabras = set(re.findall(r'\b\w{3,}\b', pregunta.lower())) - STOPWORDS
    if not palabras:
        return True
    texto_lower = texto.lower()
    coincidencias = sum(1 for p in palabras if p in texto_lower)
    ratio = coincidencias / len(palabras)
    return ratio >= UMBRAL_RELEVANCIA_NIVEL1


def buscar_en_urls_oficiales(pregunta: str) -> str:
    """Extrae texto de las URLs oficiales activas en la DB, filtrando por relevancia."""
    from app.core.database import SessionLocal
    from app.services.url_service import get_urls_activas
    import re
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
            resp = httpx.get(
                url, timeout=15, follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (compatible; InfodetsBot/1.0)"}
            )
            if resp.status_code == 200:
                texto = resp.text
                texto = re.sub(r'<script[^>]*>.*?</script>', '', texto, flags=re.DOTALL)
                texto = re.sub(r'<style[^>]*>.*?</style>', '', texto, flags=re.DOTALL)
                texto = re.sub(r'<[^>]+>', ' ', texto)
                texto = re.sub(r'\s+', ' ', texto).strip()
                if texto and _es_relevante(pregunta, texto):
                    textos.append(f"[Fuente oficial: {url}]\n{texto[:5000]}")
                elif texto:
                    logger.debug(f"[NIVEL1] URL {url} descartada por baja relevancia")
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

def _prompt(pregunta: str, contexto: str, tipo: str, memoria: dict | None = None, historial: list[dict] | None = None) -> str:
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

    # — Inyección de memoria del usuario —
    nombre_usuario = (memoria or {}).get("nombre") or ""
    es_primera = (memoria or {}).get("es_primera_consulta", False)
    resumen_previo = (memoria or {}).get("resumen") or ""
    if nombre_usuario:
        saludo = f"El usuario se llama {nombre_usuario}. {'Es su primera consulta, saludálo por su nombre.' if es_primera else 'Ya ha consultado antes, podés usar su nombre naturalmente.'}"
        system = f"{system}\n{saludo}"
    if resumen_previo:
        system = f"{system}\nConsultas previas del usuario (para contexto):\n{resumen_previo}"

    # — Historial de la conversación activa —
    historial_texto = ""
    if historial:
        entradas = [f"Usuario: {h['pregunta']}\nAsistente: {h['respuesta'][:300]}" for h in historial[-5:]]
        historial_texto = "\nHISTORIAL DE ESTA CONVERSACIÓN:\n" + "\n---\n".join(entradas) + "\n"

    if tipo == "local":
        return f"""{system}

DOCUMENTACIÓN OFICIAL DISPONIBLE:
{contexto}{historial_texto}
Pregunta del usuario: {pregunta}

Respondé basándote únicamente en la documentación oficial proporcionada arriba."""

    if tipo == "externo":
        system_externo = system.replace(
            "EXCLUSIVAMENTE en la documentación oficial proporcionada",
            "el contexto provisto"
        ).replace(
            "EXCLUSIVAMENTE en la documentación oficial",
            "el contexto provisto"
        )
        return f"""{system_externo}

CONTEXTO ENCONTRADO EN FUENTES EXTERNAS:
{contexto}{historial_texto}
Pregunta del usuario: {pregunta}

INSTRUCCIÓN: Respondé usando el contexto provisto arriba. Si el contexto contiene información relacionada con la pregunta, usála para responder e indicá la fuente. Solo si el contexto no tiene absolutamente ninguna relación con la pregunta, indicá que no tenés información disponible. No uses tu conocimiento general."""

    return f"""{system}

No se encontró documentación oficial interna sobre este tema.
Responde con tu conocimiento general si es relevante, o indicá que no tenés información disponible.{historial_texto}
Pregunta: {pregunta}"""


def generar_respuesta_stream(pregunta: str, contexto: str, tipo: str = "local", memoria: dict | None = None, historial: list[dict] | None = None):
    try:
        logger.info("[RAG] Intentando con Gemini...")
        yield from _generar_gemini_stream(pregunta, contexto, tipo, memoria, historial)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logger.warning("[RAG] Gemini rate limit — usando Groq")
            yield from _generar_groq_stream(pregunta, contexto, tipo, memoria, historial)
        else:
            raise
    except Exception as e:
        if "429" in str(e):
            logger.warning("[RAG] Gemini rate limit (exc) — usando Groq")
            yield from _generar_groq_stream(pregunta, contexto, tipo, memoria, historial)
        else:
            raise


def _generar_gemini_stream(pregunta: str, contexto: str, tipo: str, memoria: dict | None = None, historial: list[dict] | None = None):
    prompt = _prompt(pregunta, contexto, tipo, memoria, historial)
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


def _generar_groq_stream(pregunta: str, contexto: str, tipo: str, memoria: dict | None = None, historial: list[dict] | None = None):
    prompt = _prompt(pregunta, contexto, tipo, memoria, historial)
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
    if contexto_nivel2 and _es_relevante(pregunta, contexto_nivel2):
        logger.info("[LOOP] Nivel 2: contexto relevante encontrado en búsqueda web")
        return ResultadoBusqueda(2, contexto_nivel2, "externo")
    if contexto_nivel2:
        logger.debug("[LOOP] Nivel 2 descartado por baja relevancia")

    # Nivel 3 — Escalamiento humano
    logger.info("[LOOP] Nivel 3: escalamiento humano")
    return ResultadoBusqueda(3, "", "escalamiento")


# Mantener compatibilidad con código existente
def generar_respuesta(pregunta: str, contexto: str, tipo: str = "local") -> str:
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
