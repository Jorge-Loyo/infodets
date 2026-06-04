"""
HU-035: Soporte multiidioma.
Detecta el idioma del usuario y responde en el mismo idioma.
La detección se basa en patrones léxicos simples sin dependencias externas.
"""
import re

# Patrones de detección por idioma (palabras comunes exclusivas)
PATRONES = {
    "español": re.compile(
        r'\b(qué|cómo|cuál|dónde|cuándo|puedo|tiene|necesito|quiero|hola|gracias|por favor|información|documento|consulta)\b',
        re.IGNORECASE,
    ),
    "english": re.compile(
        r'\b(what|how|where|when|which|can|could|would|please|thank|hello|need|want|information|document)\b',
        re.IGNORECASE,
    ),
    "português": re.compile(
        r'\b(como|onde|quando|qual|pode|preciso|quero|olá|obrigado|por favor|informação|documento)\b',
        re.IGNORECASE,
    ),
}

INSTRUCCIONES_IDIOMA = {
    "español": "Responde siempre en español.",
    "english": "Always respond in English.",
    "português": "Sempre responda em português.",
}


def detectar_idioma(texto: str) -> str:
    """Detecta el idioma del texto basado en patrones léxicos. Default: español."""
    scores = {}
    for idioma, patron in PATRONES.items():
        matches = patron.findall(texto)
        scores[idioma] = len(matches)

    if not any(scores.values()):
        return "español"

    return max(scores, key=scores.get)


def get_instruccion_idioma(texto: str) -> str:
    """Retorna la instrucción de idioma para inyectar en el system prompt del LLM."""
    idioma = detectar_idioma(texto)
    return INSTRUCCIONES_IDIOMA.get(idioma, INSTRUCCIONES_IDIOMA["español"])


def enriquecer_system_prompt(system_prompt: str, pregunta_usuario: str) -> str:
    """Agrega la instrucción de idioma al system prompt del LLM."""
    instruccion = get_instruccion_idioma(pregunta_usuario)
    return f"{system_prompt}\n\n[IDIOMA]: {instruccion}"
