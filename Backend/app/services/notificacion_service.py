import httpx
import logging
from app.core.settings import settings

logger = logging.getLogger(__name__)


def notificar_admin_sync(evento: str, datos: dict) -> None:
    """
    Envía notificación a n8n de forma síncrona (para usar dentro de generators).
    """
    if not settings.n8n_url:
        return
    try:
        with httpx.Client(timeout=5) as client:
            client.post(
                f"{settings.n8n_url}/webhook/infodets-notificacion",
                json={"evento": evento, **datos},
                auth=(settings.n8n_user, settings.n8n_password) if settings.n8n_user else None,
            )
        logger.info(f"[N8N] Notificación enviada: {evento}")
    except Exception as e:
        logger.warning(f"[N8N] No se pudo notificar ({evento}): {e}")
