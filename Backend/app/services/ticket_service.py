import uuid
import uuid as _uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import TicketVacio, MensajeTicket

logger = logging.getLogger(__name__)

UMBRAL_TICKET = 0.70


def crear_ticket(db: Session, pregunta: str, usuario_id: str | None, puntaje: float, nivel: int = 0) -> TicketVacio | None:
    try:
        es_usuario_registrado = usuario_id and not usuario_id.startswith('invitado:')
        ticket = TicketVacio(
            id=uuid.uuid4(),
            pregunta=pregunta,
            usuario_id=usuario_id,
            puntaje_confianza=puntaje,
            nivel=nivel,
            requiere_respuesta=(nivel == 3 and es_usuario_registrado),
            estado="pendiente",
            creado_en=datetime.utcnow(),
        )
        db.add(ticket)
        db.commit()
        logger.info(f"[TICKET] Ticket creado — nivel={nivel} | score={puntaje:.3f} | requiere_respuesta={ticket.requiere_respuesta}")
        return ticket
    except Exception as e:
        logger.warning(f"[TICKET] No se pudo crear ticket: {e}")
        db.rollback()
        return None


def listar_tickets(db: Session, estado: str | None = None) -> list[TicketVacio]:
    q = db.query(TicketVacio)
    if estado:
        q = q.filter(TicketVacio.estado == estado)
    return q.order_by(TicketVacio.requiere_respuesta.desc(), TicketVacio.creado_en.desc()).all()


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


def enviar_mensaje(db: Session, ticket_id: str, autor_id: str | None, rol: str, texto: str) -> MensajeTicket | None:
    try:
        tid = _uuid.UUID(ticket_id)
        ticket = db.query(TicketVacio).filter(TicketVacio.id == tid).first()
        if not ticket:
            return None
        msg = MensajeTicket(
            id=uuid.uuid4(),
            ticket_id=tid,
            autor_id=_uuid.UUID(autor_id) if autor_id and _es_uuid(autor_id) else None,
            rol=rol,
            texto=texto,
            leido=False,
            creado_en=datetime.utcnow(),
        )
        db.add(msg)
        if rol == 'admin':
            ticket.estado = 'respondido'
            ticket.mensajes_no_leidos += 1
        db.commit()
        db.refresh(msg)
        return msg
    except Exception as e:
        logger.warning(f"[TICKET] No se pudo enviar mensaje: {e}")
        db.rollback()
        return None


def listar_mensajes(db: Session, ticket_id: str) -> list[MensajeTicket]:
    try:
        tid = _uuid.UUID(ticket_id)
    except ValueError:
        return []
    return db.query(MensajeTicket).filter(
        MensajeTicket.ticket_id == tid
    ).order_by(MensajeTicket.creado_en.asc()).all()


def marcar_leidos(db: Session, ticket_id: str, rol_lector: str) -> None:
    try:
        tid = _uuid.UUID(ticket_id)
    except ValueError:
        return
    rol_opuesto = 'admin' if rol_lector == 'usuario' else 'usuario'
    mensajes = db.query(MensajeTicket).filter(
        MensajeTicket.ticket_id == tid,
        MensajeTicket.rol == rol_opuesto,
        MensajeTicket.leido == False,
    ).all()
    for m in mensajes:
        m.leido = True
    if rol_lector == 'usuario':
        ticket = db.query(TicketVacio).filter(TicketVacio.id == tid).first()
        if ticket:
            ticket.mensajes_no_leidos = 0
    db.commit()
    logger.info(f"[TICKET] Marcados {len(mensajes)} mensajes como leidos — ticket={ticket_id[:8]} | lector={rol_lector}")


def contar_no_leidos_usuario(db: Session, usuario_id: str) -> int:
    """Cuenta tickets con mensajes no leídos para un usuario."""
    # usuario_id se guarda como string en tickets_vacios
    return db.query(TicketVacio).filter(
        TicketVacio.usuario_id == str(usuario_id),
        TicketVacio.mensajes_no_leidos > 0,
    ).count()


def _es_uuid(valor: str) -> bool:
    try:
        uuid.UUID(valor)
        return True
    except ValueError:
        return False
