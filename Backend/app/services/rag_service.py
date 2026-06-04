import httpx
import logging
from datetime import datetime
from groq import Groq
from app.core.settings import settings
from app.services.embedding_service import generate_query_embedding
from app.services.qdrant_service import search
from app.services.idioma_service import detectar_idioma, INSTRUCCIONES_IDIOMA

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"
GROQ_MODEL = "llama-3.3-70b-versatile"
SAMBANOVA_MODEL = "Meta-Llama-3.3-70B-Instruct"
SAMBANOVA_API_KEY = "b717777b-2315-4e46-a2a6-6af22c7f1b9b"
API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Umbrales del Loop de Retroalimentación
CONFIDENCE_THRESHOLD = 0.40
UMBRAL_NIVEL2 = 0.0

# Feature flags
HYDE_ENABLED = True
QUERY_EXPANSION_ENABLED = True


def _llm_rapido(system: str, user: str, max_tokens: int = 150, temperature: float = 0.3) -> str:
    """Llama a Groq o Sambanova (fallback) para tareas rápidas (HyDE, QueryExpansion)."""
    # Intentar Groq primero
    try:
        client = Groq(api_key=settings.groq_api_key)
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=temperature, max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.warning(f"[LLM] Groq falló: {e} — usando Sambanova")

    # Fallback a Sambanova
    try:
        from openai import OpenAI
        client = OpenAI(base_url="https://api.sambanova.ai/v1", api_key=SAMBANOVA_API_KEY)
        resp = client.chat.completions.create(
            model=SAMBANOVA_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=temperature, max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.warning(f"[LLM] Sambanova también falló: {e}")
        return ""

SYSTEM_PROMPT = """Eres un asistente oficial del sistema INFODETS para una entidad pública.
Tu función es responder consultas basándote EXCLUSIVAMENTE en la documentación oficial proporcionada.
Reglas:
1. Si la respuesta está en el contexto, responde con precisión y claridad.
2. Si la información no está en el contexto, indica claramente que no tienes documentación oficial sobre ese tema.
3. Nunca inventes información. La precisión legal es crítica.
4. Responde siempre en español.
5. NUNCA menciones fuentes, documentos, referencias, ni de dónde sacaste la información. Solo respondé el contenido."""

AVISO_FUENTE_EXTERNA = (
    "⚠️ He encontrado esta información en fuentes externas (no oficiales de esta oficina aún). "
    "Esta respuesta no representa documentación oficial verificada de la entidad.\n\n"
)

MENSAJE_ESCALAMIENTO = (
    "Lo sentimos, no hemos encontrado información oficial ni en fuentes externas sobre su consulta. "
    "Hemos generado un informe para que su consulta sea respondida a la brevedad posible por nuestro equipo. "
    "Le pedimos disculpas por los inconvenientes."
)


def _reranker(pregunta: str, chunks: list[dict], top_n: int = 7) -> list[dict]:
    """FASE 4 — Re-ranking: reordena chunks por relevancia real usando Cohere."""
    if not settings.cohere_api_key or not chunks:
        return chunks[:top_n]
    try:
        import cohere
        co = cohere.ClientV2(api_key=settings.cohere_api_key)
        # Incluir metadatos en el texto para mejor reranking
        documentos = []
        for r in chunks:
            meta = ""
            if r.get("titulo"):
                meta += f"Documento: {r['titulo']}. "
            if r.get("nro_resolucion"):
                meta += f"Resolución N° {r['nro_resolucion']}. "
            if r.get("nro_decreto"):
                meta += f"Decreto N° {r['nro_decreto']}. "
            documentos.append(f"{meta}{r['text'][:1024]}")

        resultado = co.rerank(
            model="rerank-v3.5",
            query=pregunta,
            documents=documentos,
            top_n=top_n,
        )
        reordenados = [chunks[r.index] for r in resultado.results]
        logger.info(f"[Rerank] {len(chunks)} → {len(reordenados)} chunks reordenados (scores: {[f'{r.relevance_score:.3f}' for r in resultado.results[:3]]})")
        return reordenados
    except Exception as e:
        logger.warning(f"[Rerank] Error: {e} — usando orden original")
        return chunks[:top_n]


# ─── FASE 3: Query Expansion ──────────────────────────────────────────────────

def _expandir_query(pregunta: str) -> list[str]:
    """Genera 2 variantes de la pregunta para mayor cobertura semántica."""
    texto = _llm_rapido(
        "Dado una pregunta sobre documentos oficiales, gené exactamente 2 variantes alternativas en español que busquen la misma información pero con diferentes palabras clave. Respondé SOLO con las 2 variantes separadas por salto de línea, sin numeración ni explicaciones.",
        pregunta, max_tokens=100, temperature=0.4
    )
    if not texto:
        return []
    variantes = [v.strip() for v in texto.strip().split("\n") if v.strip()][:2]
    logger.info(f"[QueryExp] Variantes: {variantes}")
    return variantes


# ─── FASE 2: HyDE ────────────────────────────────────────────────────────────

def _generar_hipotesis(pregunta: str) -> str:
    """Genera una respuesta hipotética para mejorar el embedding de búsqueda."""
    hipotesis = _llm_rapido(
        "Generá una respuesta breve y factual en español a la siguiente pregunta, como si fuera un fragmento de un documento oficial argentino (resolución, decreto, reglamento). Máximo 3 oraciones. Incluí términos técnicos y legales relevantes.",
        pregunta, max_tokens=150, temperature=0.3
    )
    if hipotesis:
        logger.info(f"[HyDE] Hipótesis: {hipotesis[:80]}...")
    return hipotesis


# ─── Nivel 0: Búsqueda local en Qdrant ───────────────────────────────────────

def _combinar_resultados(base: list[dict], nuevos: list[dict]) -> list[dict]:
    """Combina dos listas de resultados deduplicando por document_id+page, quedándose con mayor score."""
    vistos = {}
    for r in base:
        key = f"{r.get('document_id', '')}_{r.get('page_number', 0)}_{r['text'][:30]}"
        vistos[key] = r
    for r in nuevos:
        key = f"{r.get('document_id', '')}_{r.get('page_number', 0)}_{r['text'][:30]}"
        if key not in vistos or r["score"] > vistos[key]["score"]:
            vistos[key] = r
    return sorted(vistos.values(), key=lambda x: x["score"], reverse=True)[:15]


def buscar_contexto(pregunta: str, limit: int = 7) -> tuple[list[dict], float]:
    logger.info(f"[RAG] Buscando contexto para: {pregunta[:80]}...")
    import concurrent.futures

    # FASES 2 y 3 en paralelo: HyDE + Query Expansion + búsqueda original simultáneos
    hipotesis = ""
    variantes = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        fut_hyde = executor.submit(_generar_hipotesis, pregunta) if HYDE_ENABLED else None
        fut_variantes = executor.submit(_expandir_query, pregunta) if QUERY_EXPANSION_ENABLED else None
        # Siempre buscar con la pregunta original en paralelo
        fut_original = executor.submit(lambda: search(generate_query_embedding(pregunta), limit=10))

        hipotesis = fut_hyde.result() if fut_hyde else ""
        variantes = fut_variantes.result() if fut_variantes else []
        resultados_original = fut_original.result()

    # Buscar con hipótesis (HyDE) si se generó
    if hipotesis:
        vector_hyde = generate_query_embedding(hipotesis)
        resultados_hyde = search(vector_hyde, limit=10)
        resultados_raw = _combinar_resultados(resultados_original, resultados_hyde)
    else:
        resultados_raw = resultados_original

    max_score_actual = max((r["score"] for r in resultados_raw), default=0.0)

    # Si sigue bajo umbral, usar variantes
    if max_score_actual < CONFIDENCE_THRESHOLD and variantes:
        for variante in variantes:
            try:
                vector_var = generate_query_embedding(variante)
                resultados_raw = _combinar_resultados(resultados_raw, search(vector_var, limit=5))
            except Exception:
                pass
        max_score_actual = max((r["score"] for r in resultados_raw), default=0.0)
        logger.info(f"[QueryExp] Nuevo max tras variantes: {max_score_actual:.3f}")

    docs_reales = [r for r in resultados_raw if r.get("source_url", "")]
    validaciones = [r for r in resultados_raw if not r.get("source_url", "")]
    candidatos = (docs_reales + validaciones)[:15]

    # FASE 4 — Re-ranking con metadatos
    resultados = _reranker(pregunta, candidatos, top_n=limit)

    max_score = max((r["score"] for r in (docs_reales[:limit] or resultados)), default=0.0)
    logger.info(f"[RAG] {len(resultados_raw)} chunks ({len(docs_reales)} docs reales) — score máximo: {max_score:.3f}")
    return resultados, max_score


def construir_contexto(resultados: list[dict]) -> str:
    if not resultados:
        return ""
    docs = [r for r in resultados if r.get("source_url", "")]
    if not docs:
        docs = resultados
    partes = []
    for i, r in enumerate(docs):
        partes.append(r['text'])
    # Deduplicar textos iguales
    vistos = []
    unicos = []
    for p in partes:
        if p not in vistos:
            vistos.append(p)
            unicos.append(p)
    return "\n\n---\n\n".join(unicos)


# ─── Nivel 1: Búsqueda en URLs oficiales predefinidas ────────────────────────

UMBRAL_RELEVANCIA_NIVEL1 = 0.40
STOPWORDS = {
    'cual', 'como', 'donde', 'quien', 'quién', 'cuál', 'cómo', 'dónde',
    'para', 'este', 'esta', 'esto', 'esos', 'esas', 'tiene', 'sabe', 'sabes',
    'sobre', 'del', 'los', 'las', 'una', 'uno', 'son', 'hay', 'fue', 'ser',
    'sus', 'por', 'con', 'que', 'nombre',
}


def _es_relevante(pregunta: str, texto: str) -> bool:
    import re
    palabras = set(re.findall(r'\b\w{3,}\b', pregunta.lower())) - STOPWORDS
    if not palabras:
        return True
    texto_lower = texto.lower()
    coincidencias = sum(1 for p in palabras if p in texto_lower)
    ratio = coincidencias / len(palabras)
    return ratio >= UMBRAL_RELEVANCIA_NIVEL1


def buscar_en_urls_oficiales(pregunta: str) -> str:
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


# ─── Generación de respuesta — FASE 1: System/User separados ─────────────────

def _construir_system(tipo: str, memoria: dict | None = None) -> str:
    """Construye el system prompt con identidad del bot, fecha, feriados y memoria."""
    system = SYSTEM_PROMPT
    try:
        from app.core.database import SessionLocal
        from app.models.models import BotIdentidad
        from datetime import timezone, timedelta
        db = SessionLocal()
        bot = db.query(BotIdentidad).first()
        db.close()
        ar_tz = timezone(timedelta(hours=-3))
        ahora = datetime.now(ar_tz)
        fecha_hora = ahora.strftime('%A %d de %B de %Y, %H:%M hs (hora Argentina)')
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
1. Si la respuesta está en el contexto, respondé con precisión y claridad.
2. Si la información no está en el contexto, indicá claramente que no tenés documentación oficial sobre ese tema.
3. Nunca inventes información. La precisión legal es crítica.
4. Respondé siempre en {bot.idioma}.
5. NUNCA menciones fuentes, documentos, referencias, ni de dónde sacaste la información. Solo respondé el contenido.
6. EXCEPCIÓN: Para preguntas sobre fecha, hora, día, feriados, calendario o información general de Argentina, respondé usando los datos de contexto del sistema sin necesidad de documentación oficial."""
        else:
            system = f"""{SYSTEM_PROMPT}
País: Argentina | Zona horaria: America/Argentina/Buenos_Aires (UTC-3)
Fecha y hora actual: {fecha_hora}{feriados_info}
EXCEPCIÓN: Para preguntas sobre fecha, hora, día, feriados o calendario, respondé usando los datos de contexto del sistema sin necesidad de documentación oficial."""
    except Exception:
        pass

    if tipo == "externo":
        system = system.replace(
            "EXCLUSIVAMENTE en la documentación oficial proporcionada",
            "el contexto provisto"
        ).replace(
            "EXCLUSIVAMENTE en la documentación oficial",
            "el contexto provisto"
        )

    nombre_usuario = (memoria or {}).get("nombre") or ""
    es_primera = (memoria or {}).get("es_primera_consulta", False)
    resumen_previo = (memoria or {}).get("resumen") or ""
    if nombre_usuario:
        saludo = f"El usuario se llama {nombre_usuario}. {'Es su primera consulta, saludálo por su nombre.' if es_primera else 'Ya ha consultado antes, podés usar su nombre naturalmente.'}"
        system = f"{system}\n{saludo}"
    if resumen_previo:
        system = f"{system}\nConsultas previas del usuario (para contexto):\n{resumen_previo}"

    return system


def _construir_user(pregunta: str, contexto: str, tipo: str, historial: list[dict] | None = None) -> str:
    """Construye el mensaje del usuario con contexto e historial."""
    historial_texto = ""
    if historial:
        entradas = [f"Usuario: {h['pregunta']}\nAsistente: {h['respuesta'][:300]}" for h in historial[-5:]]
        historial_texto = "\nHISTORIAL DE ESTA CONVERSACIÓN:\n" + "\n---\n".join(entradas) + "\n"

    if tipo == "local":
        return f"""DOCUMENTACIÓN OFICIAL DISPONIBLE:
{contexto}{historial_texto}
Pregunta: {pregunta}

INSTRUCCIONES DE FORMATO (OBLIGATORIAS):
- Respondé de forma natural, clara y fluida.
- PROHIBIDO mencionar fuentes, números de fuente, nombres de documentos, o referencias de cualquier tipo. Ni dentro del texto ni al final.
- Solo respondé el contenido informativo puro, sin citar de dónde viene.
- Basáte ÚNICAMENTE en la documentación proporcionada.
- Si la pregunta es ambigua, pedí aclaración."""

    if tipo == "externo":
        return f"""CONTEXTO ENCONTRADO EN FUENTES EXTERNAS:
{contexto}{historial_texto}
Pregunta: {pregunta}

INSTRUCCIÓN: Respondé usando el contexto provisto arriba. Si el contexto contiene información relacionada con la pregunta, usála para responder e indicá la fuente. Solo si el contexto no tiene absolutamente ninguna relación con la pregunta, indicá que no tenés información disponible. No uses tu conocimiento general."""

    return f"""No se encontró documentación oficial interna sobre este tema.{historial_texto}
Pregunta: {pregunta}"""


def generar_respuesta_stream(pregunta: str, contexto: str, tipo: str = "local", memoria: dict | None = None, historial: list[dict] | None = None):
    """Intenta Gemini -> Groq -> Sambanova. El primero que funcione genera la respuesta."""
    # Intento 1: Gemini
    try:
        logger.info("[RAG] Intentando Gemini...")
        texto = _generar_respuesta_sync(pregunta, contexto, tipo, memoria, historial, "gemini")
        if texto:
            yield texto
            return
    except Exception as e:
        logger.warning(f"[RAG] Gemini falló: {str(e)[:80]}")

    # Intento 2: Groq
    try:
        logger.info("[RAG] Intentando Groq...")
        texto = _generar_respuesta_sync(pregunta, contexto, tipo, memoria, historial, "groq")
        if texto:
            yield texto
            return
    except Exception as e:
        logger.warning(f"[RAG] Groq falló: {str(e)[:80]}")

    # Intento 3: Sambanova
    try:
        logger.info("[RAG] Intentando Sambanova...")
        texto = _generar_respuesta_sync(pregunta, contexto, tipo, memoria, historial, "sambanova")
        if texto:
            yield texto
            return
    except Exception as e:
        logger.error(f"[RAG] Sambanova falló: {str(e)[:80]}")

    yield "Lo siento, los servicios de IA están temporalmente saturados. Por favor intentá de nuevo en unos minutos."


def _generar_respuesta_sync(pregunta: str, contexto: str, tipo: str, memoria, historial, provider: str) -> str:
    system = _construir_system(tipo, memoria)
    # HU-035: Detectar idioma del usuario y adaptar respuesta
    idioma_detectado = detectar_idioma(pregunta)
    instruccion_idioma = INSTRUCCIONES_IDIOMA.get(idioma_detectado, "")
    if instruccion_idioma:
        system = f"{system}\n[IDIOMA DETECTADO]: {instruccion_idioma}"
    user = _construir_user(pregunta, contexto, tipo, historial)

    if provider == "gemini":
        url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent"
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
        }
        response = httpx.post(
            url, json=payload,
            params={"key": settings.gemini_generation_key or settings.gemini_api_key},
            timeout=60,
        )
        response.raise_for_status()
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]

    elif provider == "groq":
        client = Groq(api_key=settings.groq_api_key)
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.1, max_tokens=2048,
        )
        return resp.choices[0].message.content or ""

    elif provider == "sambanova":
        from openai import OpenAI
        client = OpenAI(base_url="https://api.sambanova.ai/v1", api_key=SAMBANOVA_API_KEY)
        resp = client.chat.completions.create(
            model=SAMBANOVA_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.1, max_tokens=2048,
        )
        return resp.choices[0].message.content or ""

    return ""


def _generar_gemini_stream(pregunta: str, contexto: str, tipo: str, memoria: dict | None = None, historial: list[dict] | None = None):
    system = _construir_system(tipo, memoria)
    user = _construir_user(pregunta, contexto, tipo, historial)
    url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
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
    system = _construir_system(tipo, memoria)
    user = _construir_user(pregunta, contexto, tipo, historial)
    client = Groq(api_key=settings.groq_api_key)
    stream = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        stream=True, temperature=0.1, max_tokens=2048,
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text


def _generar_sambanova_stream(pregunta: str, contexto: str, tipo: str, memoria: dict | None = None, historial: list[dict] | None = None):
    from openai import OpenAI
    system = _construir_system(tipo, memoria)
    user = _construir_user(pregunta, contexto, tipo, historial)
    client = OpenAI(base_url="https://api.sambanova.ai/v1", api_key=SAMBANOVA_API_KEY)
    stream = client.chat.completions.create(
        model=SAMBANOVA_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        stream=True, temperature=0.1, max_tokens=2048,
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


# ─── Función principal del loop de retroalimentación ─────────────────────────

class ResultadoBusqueda:
    def __init__(self, nivel: int, contexto: str, tipo_respuesta: str):
        self.nivel = nivel
        self.contexto = contexto
        self.tipo_respuesta = tipo_respuesta


def ejecutar_loop_retroalimentacion(pregunta: str, max_score: float, resultados_qdrant: list[dict]) -> ResultadoBusqueda:
    if max_score >= CONFIDENCE_THRESHOLD:
        return ResultadoBusqueda(0, construir_contexto(resultados_qdrant), "local")

    logger.info(f"[LOOP] Score {max_score:.3f} < {CONFIDENCE_THRESHOLD} — activando fallback escalonado")

    contexto_nivel1 = buscar_en_urls_oficiales(pregunta)
    if contexto_nivel1:
        logger.info("[LOOP] Nivel 1: contexto encontrado en URLs oficiales")
        return ResultadoBusqueda(1, contexto_nivel1, "externo")

    contexto_nivel2 = buscar_en_web(pregunta)
    if contexto_nivel2 and _es_relevante(pregunta, contexto_nivel2):
        logger.info("[LOOP] Nivel 2: contexto relevante encontrado en búsqueda web")
        return ResultadoBusqueda(2, contexto_nivel2, "externo")
    if contexto_nivel2:
        logger.debug("[LOOP] Nivel 2 descartado por baja relevancia")

    logger.info("[LOOP] Nivel 3: escalamiento humano")
    return ResultadoBusqueda(3, "", "escalamiento")


# Mantener compatibilidad con código existente
def generar_respuesta(pregunta: str, contexto: str, tipo: str = "local") -> str:
    system = _construir_system(tipo)
    user = _construir_user(pregunta, contexto, tipo)
    url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
    }
    response = httpx.post(
        url, json=payload,
        params={"key": settings.gemini_generation_key or settings.gemini_api_key},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]
