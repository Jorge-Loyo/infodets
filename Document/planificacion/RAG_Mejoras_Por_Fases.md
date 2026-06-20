# INFODETS — Plan de Mejoras RAG
## Documento de Desarrollo por Fases

---

## Contexto actual

El sistema RAG de INFODETS implementa un loop de retroalimentación de 4 niveles:
- **Nivel 0** — Búsqueda vectorial en Qdrant (umbral ≥ 75%)
- **Nivel 1** — Scraping de URLs oficiales con filtro de relevancia léxica
- **Nivel 2** — Búsqueda web (Serper API) con filtro de relevancia léxica
- **Nivel 3** — Escalamiento humano + ticket

LLMs: Gemini 2.0 Flash Lite (primario) + Groq llama-3.3-70b (fallback)
Embeddings: Google gemini-embedding-001 (3072 dims)

---

## FASE 1 — System/User Messages Separados
**Prioridad:** Alta | **Esfuerzo:** Bajo | **Impacto:** Alto

### Problema actual
Actualmente todo el prompt (system + contexto + pregunta) se envía en un único mensaje `role: user`. Los LLMs modernos responden mejor cuando el system prompt va en `role: system` y la pregunta del usuario en `role: user`.

### Cambios
- `rag_service.py` — Separar `_prompt()` en `_system_prompt()` y `_user_prompt()`
- `_generar_groq_stream()` — Usar `messages=[{"role": "system", ...}, {"role": "user", ...}]`
- `_generar_gemini_stream()` — Usar `systemInstruction` en el payload

### Archivos a modificar
- `Backend/app/services/rag_service.py`

### Resultado esperado
- Mejor seguimiento de instrucciones del system prompt
- Respuestas más coherentes con la identidad del bot
- Menor "contaminación" entre instrucciones y contexto

---

## FASE 2 — HyDE (Hypothetical Document Embeddings)
**Prioridad:** Alta | **Esfuerzo:** Medio | **Impacto:** Muy Alto

### Problema actual
Se busca el embedding de la **pregunta** del usuario. Las preguntas y los documentos tienen distribuciones vectoriales diferentes — una pregunta corta tiene un vector muy distinto al de un párrafo de respuesta, aunque hablen del mismo tema.

### Solución
1. Generar una respuesta hipotética breve con el LLM (sin contexto)
2. Calcular el embedding de esa respuesta hipotética
3. Usar ESE embedding para buscar en Qdrant

### Cambios
- `rag_service.py` — Nueva función `generar_hipotesis(pregunta)` que llama a Groq con temperatura 0.3
- `buscar_contexto()` — Usar embedding de la hipótesis en vez de la pregunta directa
- Fallback: si la hipótesis falla, usar embedding de la pregunta original

### Archivos a modificar
- `Backend/app/services/rag_service.py`

### Resultado esperado
- Mejora del recall en Qdrant del ~20-40%
- Encuentra chunks relevantes que antes quedaban fuera del top-5
- Especialmente útil para preguntas vagas o referenciales ("dame los de tecnología")

---

## FASE 3 — Query Expansion
**Prioridad:** Media | **Esfuerzo:** Bajo | **Impacto:** Medio-Alto

### Problema actual
Una pregunta como "portales de trabajo tecnología" no matchea con chunks que usan "bolsas de empleo IT" o "ofertas laborales tech". El vocabulario del usuario y el de los documentos puede diferir.

### Solución
Antes de buscar, generar 2-3 variantes de la pregunta con el LLM y buscar con todas, luego hacer union de resultados con deduplicación.

### Cambios
- `rag_service.py` — Nueva función `expandir_query(pregunta)` → lista de variantes
- `buscar_contexto()` — Buscar con pregunta original + variantes, deduplicar por `document_id`
- Límite: máximo 3 variantes para no aumentar latencia

### Archivos a modificar
- `Backend/app/services/rag_service.py`

### Resultado esperado
- Mayor cobertura semántica en la búsqueda
- Reduce falsos negativos cuando el usuario usa vocabulario diferente al de los documentos
- Mejora especialmente en preguntas técnicas o con jerga

---

## FASE 4 — Re-ranking de Chunks
**Prioridad:** Media | **Esfuerzo:** Medio | **Impacto:** Alto

### Problema actual
Los chunks se ordenan por similitud coseno. Similitud vectorial ≠ relevancia real para responder la pregunta. Un chunk puede tener score alto por compartir vocabulario general pero no responder la pregunta específica.

### Solución
Después de recuperar los top-10 chunks de Qdrant, aplicar un re-ranker que evalúa cada par (pregunta, chunk) y reordena por relevancia real.

### Opciones de re-ranker
- **Cohere Rerank API** — Gratis hasta 1000 req/mes, fácil integración
- **Cross-encoder local** — `cross-encoder/ms-marco-MiniLM-L-6-v2` (HuggingFace), sin costo pero requiere más RAM
- **LLM-based reranking** — Pedir al LLM que ordene los chunks por relevancia (más lento)

### Cambios
- `rag_service.py` — Nueva función `reranker(pregunta, chunks)` → chunks reordenados
- `buscar_contexto()` — Buscar top-10, reranker, retornar top-5
- `settings.py` — Nueva variable `COHERE_API_KEY` (opcional)

### Archivos a modificar
- `Backend/app/services/rag_service.py`
- `Backend/app/core/settings.py`
- `Backend/.env`

### Resultado esperado
- Los chunks más relevantes llegan primero al LLM
- Reduce alucinaciones por contexto irrelevante
- Mejora la precisión de las citas de fuentes

---

## FASE 5 — Parent-Child Retrieval
**Prioridad:** Media | **Esfuerzo:** Alto | **Impacto:** Alto

### Problema actual
Los chunks actuales son fragmentos fijos de ~500 tokens. Si la respuesta está en el límite entre dos chunks, se pierde contexto. El LLM recibe fragmentos desconectados.

### Solución
Indexar dos niveles de chunks:
- **Chunks hijo** (pequeños, ~150 tokens) — para búsqueda precisa
- **Chunks padre** (grandes, ~500 tokens) — para contexto al LLM

Al recuperar un chunk hijo relevante, enviar al LLM el chunk padre correspondiente.

### Cambios
- `ingesta_service.py` — Generar chunks hijo y padre, guardar `parent_id` en metadata de Qdrant
- `qdrant_service.py` — Nueva función `get_parent_chunk(parent_id)`
- `rag_service.py` — `construir_contexto()` usa chunks padre en vez de hijo
- Migración Alembic: no requerida (metadata en Qdrant)

### Archivos a modificar
- `Backend/app/services/ingesta_service.py`
- `Backend/app/services/qdrant_service.py`
- `Backend/app/services/rag_service.py`

### Nota
Requiere re-indexar todos los documentos existentes.

### Resultado esperado
- Contexto más completo y coherente para el LLM
- Menos respuestas cortadas o incompletas
- Mejor comprensión de tablas y listas en documentos

---

## FASE 6 — Caché Semántico
**Prioridad:** Baja | **Esfuerzo:** Medio | **Impacto:** Medio

### Problema actual
Cada consulta genera embeddings + búsqueda Qdrant + llamada LLM. Preguntas similares ("¿cuáles son los beneficios?" vs "¿qué beneficios tienen?") generan el mismo proceso completo.

### Solución
Antes de ejecutar el loop RAG, buscar en un caché si existe una respuesta reciente para una pregunta semánticamente similar (coseno > 0.95).

### Cambios
- Nueva tabla `cache_respuestas` en PostgreSQL: `pregunta`, `embedding`, `respuesta`, `creado_en`, `ttl`
- `rag_service.py` — `buscar_en_cache(pregunta)` y `guardar_en_cache(pregunta, respuesta)`
- TTL configurable (default: 24 horas)
- Invalidar caché al subir nuevo documento

### Archivos a modificar
- `Backend/app/services/rag_service.py`
- `Backend/app/models/models.py`
- Nueva migración Alembic

### Resultado esperado
- Reducción de latencia del 60-80% en preguntas frecuentes
- Reducción de costos de API (embeddings + LLM)
- Mejor experiencia de usuario en horarios pico

---

## Resumen de Fases

| Fase | Nombre | Esfuerzo | Impacto | Estado |
|------|--------|----------|---------|--------|
| 1 | System/User Messages Separados | Bajo | Alto | ✅ Completada |
| 2 | HyDE | Medio | Muy Alto | ✅ Completada |
| 3 | Query Expansion | Bajo | Medio-Alto | ✅ Completada |
| 4 | Re-ranking de Chunks | Medio | Alto | ✅ Completada |
| 5 | Parent-Child Retrieval | Alto | Alto | Pendiente |
| 6 | Caché Semántico | Medio | Medio | Pendiente |

---

## Orden de implementación recomendado

1. **Fase 1** — Cambio mínimo, impacto inmediato en calidad de respuestas
2. **Fase 2** — Mayor mejora en recall, base para las demás fases
3. **Fase 3** — Complementa Fase 2, bajo esfuerzo
4. **Fase 4** — Mejora precisión, requiere decisión sobre re-ranker a usar
5. **Fase 6** — Optimización de performance
6. **Fase 5** — Requiere re-indexar documentos, hacer al final

---

*Documento creado: Mayo 2025*
*Proyecto: INFODETS — Sistema de Gestión de Conocimiento Dinámico*
