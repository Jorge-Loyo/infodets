"""
Tests automatizados del sistema RAG — INFODETS
Ejecutar con: pytest tests/test_rag.py -v
"""
import pytest
import math
from unittest.mock import patch, MagicMock


# ─── Tests Fase 1: System/User separados ─────────────────────────────────────

class TestFase1SystemUser:

    def test_construir_system_retorna_string(self):
        from app.services.rag_service import _construir_system
        with patch("app.services.rag_service.httpx.get") as mock_get:
            mock_get.return_value = MagicMock(status_code=404)
            result = _construir_system("local")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_construir_user_local_contiene_documentacion(self):
        from app.services.rag_service import _construir_user
        result = _construir_user("¿Qué es INFODETS?", "Contexto de prueba", "local")
        assert "DOCUMENTACIÓN OFICIAL" in result
        assert "¿Qué es INFODETS?" in result

    def test_construir_user_externo_contiene_instruccion(self):
        from app.services.rag_service import _construir_user
        result = _construir_user("¿Qué es Python?", "Contexto externo", "externo")
        assert "CONTEXTO ENCONTRADO EN FUENTES EXTERNAS" in result
        assert "INSTRUCCIÓN" in result

    def test_construir_user_incluye_historial(self):
        from app.services.rag_service import _construir_user
        historial = [{"pregunta": "Hola", "respuesta": "Hola, ¿en qué puedo ayudarte?"}]
        result = _construir_user("¿Cómo estás?", "", "local", historial)
        assert "HISTORIAL DE ESTA CONVERSACIÓN" in result
        assert "Hola" in result

    def test_construir_system_con_memoria_incluye_nombre(self):
        from app.services.rag_service import _construir_system
        memoria = {"nombre": "Jorge", "es_primera_consulta": True, "resumen": ""}
        with patch("app.services.rag_service.httpx.get") as mock_get:
            mock_get.return_value = MagicMock(status_code=404)
            result = _construir_system("local", memoria)
        assert "Jorge" in result


# ─── Tests Fase 2: HyDE ───────────────────────────────────────────────────────

class TestFase2HyDE:

    def test_generar_hipotesis_retorna_string(self):
        from app.services.rag_service import _generar_hipotesis
        mock_resp = MagicMock()
        mock_resp.choices[0].message.content = "Los portales de trabajo incluyen LinkedIn y Indeed."
        with patch("app.services.rag_service.Groq") as mock_groq:
            mock_groq.return_value.chat.completions.create.return_value = mock_resp
            result = _generar_hipotesis("¿Cuáles son los portales de trabajo?")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_generar_hipotesis_fallback_en_error(self):
        from app.services.rag_service import _generar_hipotesis
        with patch("app.services.rag_service.Groq") as mock_groq:
            mock_groq.return_value.chat.completions.create.side_effect = Exception("API error")
            result = _generar_hipotesis("¿Cuáles son los portales de trabajo?")
        assert result == ""


# ─── Tests Fase 3: Query Expansion ───────────────────────────────────────────

class TestFase3QueryExpansion:

    def test_expandir_query_retorna_lista(self):
        from app.services.rag_service import _expandir_query
        mock_resp = MagicMock()
        mock_resp.choices[0].message.content = "¿Qué bolsas de empleo existen?\n¿Dónde buscar trabajo online?"
        with patch("app.services.rag_service.Groq") as mock_groq:
            mock_groq.return_value.chat.completions.create.return_value = mock_resp
            result = _expandir_query("¿Cuáles son los portales de trabajo?")
        assert isinstance(result, list)
        assert len(result) <= 2

    def test_expandir_query_fallback_en_error(self):
        from app.services.rag_service import _expandir_query
        with patch("app.services.rag_service.Groq") as mock_groq:
            mock_groq.return_value.chat.completions.create.side_effect = Exception("API error")
            result = _expandir_query("¿Cuáles son los portales de trabajo?")
        assert result == []


# ─── Tests Fase 4: Re-ranking ─────────────────────────────────────────────────

class TestFase4Reranking:

    def test_reranker_sin_api_key_retorna_original(self):
        from app.services.rag_service import _reranker
        chunks = [{"text": f"Chunk {i}", "score": 0.8 - i * 0.1} for i in range(5)]
        with patch("app.services.rag_service.settings") as mock_settings:
            mock_settings.cohere_api_key = ""
            result = _reranker("pregunta", chunks, top_n=3)
        assert len(result) == 3
        assert result == chunks[:3]

    def test_reranker_con_api_key_reordena(self):
        from app.services.rag_service import _reranker
        chunks = [
            {"text": "Banco Galicia ofrece empleos", "score": 0.7},
            {"text": "Portales de tecnología", "score": 0.8},
            {"text": "Empleos en el sector bancario BBVA", "score": 0.6},
        ]
        mock_result = MagicMock()
        mock_result.results = [MagicMock(index=0), MagicMock(index=2)]
        with patch("app.services.rag_service.settings") as mock_settings:
            mock_settings.cohere_api_key = "test-key"
            with patch("cohere.ClientV2") as mock_cohere:
                mock_cohere.return_value.rerank.return_value = mock_result
                result = _reranker("empleos bancarios", chunks, top_n=2)
        assert len(result) == 2
        assert result[0]["text"] == "Banco Galicia ofrece empleos"

    def test_reranker_fallback_en_error(self):
        from app.services.rag_service import _reranker
        chunks = [{"text": f"Chunk {i}", "score": 0.8} for i in range(5)]
        with patch("app.services.rag_service.settings") as mock_settings:
            mock_settings.cohere_api_key = "test-key"
            with patch("cohere.ClientV2") as mock_cohere:
                mock_cohere.return_value.rerank.side_effect = Exception("API error")
                result = _reranker("pregunta", chunks, top_n=3)
        assert len(result) == 3


# ─── Tests Fase 5: Parent-Child ───────────────────────────────────────────────

class TestFase5ParentChild:

    def test_fragmentar_texto_child_mas_pequeno_que_parent(self):
        from app.services.ingesta_service import fragmentar_texto, CHILD_CHUNK_SIZE, PARENT_CHUNK_SIZE
        texto = "Lorem ipsum " * 500
        chunks_child = fragmentar_texto(texto, CHILD_CHUNK_SIZE, 50)
        chunks_parent = fragmentar_texto(texto, PARENT_CHUNK_SIZE, 100)
        assert len(chunks_child) > len(chunks_parent)

    def test_child_chunk_size_menor_que_parent(self):
        from app.services.ingesta_service import CHILD_CHUNK_SIZE, PARENT_CHUNK_SIZE
        assert CHILD_CHUNK_SIZE < PARENT_CHUNK_SIZE

    def test_fragmentar_texto_no_vacio(self):
        from app.services.ingesta_service import fragmentar_texto
        texto = "Este es un texto de prueba para verificar la fragmentación. " * 20
        chunks = fragmentar_texto(texto, 300, 50)
        assert len(chunks) > 0
        assert all(len(c) > 0 for c in chunks)


# ─── Tests Fase 6: Caché Semántico ───────────────────────────────────────────

class TestFase6Cache:

    def test_coseno_vectores_identicos(self):
        from app.services.cache_service import _coseno
        v = [1.0, 0.5, 0.3]
        assert abs(_coseno(v, v) - 1.0) < 1e-6

    def test_coseno_vectores_ortogonales(self):
        from app.services.cache_service import _coseno
        v1 = [1.0, 0.0]
        v2 = [0.0, 1.0]
        assert abs(_coseno(v1, v2)) < 1e-6

    def test_coseno_vectores_similares(self):
        from app.services.cache_service import _coseno
        v1 = [1.0, 0.9, 0.8]
        v2 = [0.9, 1.0, 0.8]
        score = _coseno(v1, v2)
        assert score > 0.95

    def test_buscar_en_cache_sin_entradas(self):
        from app.services.cache_service import buscar_en_cache
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = []
        result = buscar_en_cache(mock_db, [0.1, 0.2, 0.3])
        assert result is None

    def test_buscar_en_cache_hit_exacto(self):
        from app.services.cache_service import buscar_en_cache, UMBRAL_SIMILITUD_CACHE
        from datetime import datetime, timedelta
        embedding = [1.0, 0.0, 0.0]
        entrada = MagicMock()
        entrada.embedding = [1.0, 0.0, 0.0]
        entrada.expira_en = datetime.utcnow() + timedelta(hours=1)
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [entrada]
        result = buscar_en_cache(mock_db, embedding)
        assert result is not None

    def test_buscar_en_cache_miss_baja_similitud(self):
        from app.services.cache_service import buscar_en_cache
        from datetime import datetime, timedelta
        embedding = [1.0, 0.0, 0.0]
        entrada = MagicMock()
        entrada.embedding = [0.0, 1.0, 0.0]  # ortogonal = similitud 0
        entrada.expira_en = datetime.utcnow() + timedelta(hours=1)
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [entrada]
        result = buscar_en_cache(mock_db, embedding)
        assert result is None


# ─── Tests Loop RAG ───────────────────────────────────────────────────────────

class TestLoopRAG:

    def test_construir_contexto_vacio(self):
        from app.services.rag_service import construir_contexto
        assert construir_contexto([]) == ""

    def test_construir_contexto_con_docs(self):
        from app.services.rag_service import construir_contexto
        resultados = [
            {"text": "Texto 1", "source_url": "/v1/doc/1", "score": 0.9},
            {"text": "Texto 2", "source_url": "/v1/doc/2", "score": 0.8},
        ]
        result = construir_contexto(resultados)
        assert "Texto 1" in result
        assert "Texto 2" in result
        assert "/v1/doc/1" in result

    def test_construir_contexto_excluye_validaciones(self):
        from app.services.rag_service import construir_contexto
        resultados = [
            {"text": "Doc real", "source_url": "/v1/doc/1", "score": 0.9},
            {"text": "Validacion", "source_url": "", "score": 0.95},
        ]
        result = construir_contexto(resultados)
        assert "Doc real" in result
        assert "Validacion" not in result

    def test_es_relevante_match_alto(self):
        from app.services.rag_service import _es_relevante
        pregunta = "portales trabajo tecnologia"
        texto = "Los portales de trabajo en tecnología incluyen LinkedIn y GitHub Jobs"
        assert _es_relevante(pregunta, texto) is True

    def test_es_relevante_match_bajo(self):
        from app.services.rag_service import _es_relevante
        pregunta = "jefe empresa"
        texto = "Python es un lenguaje de programación orientado a objetos"
        assert _es_relevante(pregunta, texto) is False

    def test_combinar_resultados_deduplicacion(self):
        from app.services.rag_service import _combinar_resultados
        base = [{"text": "Texto A repetido", "score": 0.7, "source_url": ""}]
        nuevos = [{"text": "Texto A repetido", "score": 0.9, "source_url": ""}]
        result = _combinar_resultados(base, nuevos)
        textos = [r["text"] for r in result]
        assert textos.count("Texto A repetido") == 1
        assert result[0]["score"] == 0.9

    def test_nivel3_cuando_score_cero(self):
        from app.services.rag_service import ejecutar_loop_retroalimentacion
        with patch("app.services.rag_service.buscar_en_urls_oficiales", return_value=""):
            with patch("app.services.rag_service.buscar_en_web", return_value=""):
                resultado = ejecutar_loop_retroalimentacion("pregunta sin respuesta", 0.0, [])
        assert resultado.nivel == 3
        assert resultado.tipo_respuesta == "escalamiento"

    def test_nivel0_cuando_score_alto(self):
        from app.services.rag_service import ejecutar_loop_retroalimentacion, CONFIDENCE_THRESHOLD
        resultados = [{"text": "Contexto relevante", "source_url": "/v1/doc/1", "score": 0.9}]
        resultado = ejecutar_loop_retroalimentacion("pregunta", CONFIDENCE_THRESHOLD + 0.01, resultados)
        assert resultado.nivel == 0
        assert resultado.tipo_respuesta == "local"
