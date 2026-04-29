import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import TicketVacio

logger = logging.getLogger(__name__)

UMBRAL_TICKET = 0.3


def crear_ticket(db: Session, pregunta: str, usuario_id: str | None, puntaje: float) -> None:
    """Crea un ticket silencioso cuando el score es menor al umbral."""
    try:
        ticket = TicketVacio(
            id=uuid.uuid4(),
            pregunta=pregunta,
            usuario_id=usuario_id,
            puntaje_confianza=puntaje,
            estado="pendiente",
            creado_en=datetime.utcnow(),
        )
        db.add(ticket)
        db.commit()
        logger.info(f"[TICKET] Ticket creado — score={puntaje:.3f} | pregunta='{pregunta[:50]}'")
    except Exception as e:
        logger.warning(f"[TICKET] No se pudo crear ticket: {e}")
        db.rollback()


def listar_tickets(db: Session, estado: str | None = None) -> list[TicketVacio]:
    q = db.query(TicketVacio)
    if estado:
        q = q.filter(TicketVacio.estado == estado)
    return q.order_by(TicketVacio.creado_en.desc()).all()


def marcar_revisado(db: Session, ticket_id: str) -> TicketVacio | None:
    ticket = db.query(TicketVacio).filter(TicketVacio.id == ticket_id).first()
    if not ticket:
        return None
    ticket.estado = "revisado"
    db.commit()
    db.refresh(ticket)
    return ticket


def eliminar_ticket(db: Session, ticket_id: str) -> bool:
    ticket = db.query(TicketVacio).filter(TicketVacio.id == ticket_id).first()
    if not ticket:
        return False
    db.delete(ticket)
    db.commit()
    return True
