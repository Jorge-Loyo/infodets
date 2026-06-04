"""
HU-032: Notificaciones por email al usuario cuando el admin responde un ticket.
Se envía via n8n webhook.
"""
import logging
import httpx
from app.core.settings import settings

logger = logging.getLogger(__name__)


def notificar_usuario_respuesta(email: str, nombre: str, ticket_pregunta: str, ticket_id: str) -> bool:
    """Notifica al usuario por email (via n8n) que su ticket fue respondido."""
    if not settings.n8n_url:
        logger.warning("[NOTIF_USUARIO] n8n_url no configurado")
        return False

    payload = {
        "tipo": "respuesta_ticket",
        "email": email,
        "nombre": nombre,
        "pregunta_original": ticket_pregunta[:200],
        "ticket_id": ticket_id,
        "login_url": settings.frontend_url,
        "mensaje": f"Tu consulta '{ticket_pregunta[:80]}...' fue respondida por un administrador. Ingresá al sistema para ver la respuesta.",
    }

    try:
        resp = httpx.post(
            f"{settings.n8n_url}/webhook/infodets-notificacion-usuario",
            json=payload,
            timeout=5,
        )
        logger.info(f"[NOTIF_USUARIO] Email enviado a {email} — status={resp.status_code}")
        return resp.status_code < 400
    except Exception as e:
        logger.warning(f"[NOTIF_USUARIO] No se pudo notificar a {email}: {e}")
        return False
