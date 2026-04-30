from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional
from app.core.database import get_db
from app.services import ticket_service
from app.middleware.auth_middleware import require_permiso, get_current_user
from app.models.models import TicketVacio, Usuario
import uuid as _uuid

router = APIRouter(prefix="/tickets", tags=["Tickets"])


class TicketSchema(BaseModel):
    id: str
    pregunta: str
    usuario_id: Optional[str] = None
    usuario_nombre: Optional[str] = None
    usuario_email: Optional[str] = None
    puntaje_confianza: float
    nivel: int
    requiere_respuesta: bool
    mensajes_no_leidos: int
    estado: str
    creado_en: str

    @field_validator('id', mode='before')
    @classmethod
    def uuid_to_str(cls, v):
        return str(v) if v is not None else None

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, t, usuario: Optional[Usuario] = None):
        return cls(
            id=str(t.id),
            pregunta=t.pregunta,
            usuario_id=t.usuario_id,
            usuario_nombre=f"{usuario.nombre or ''} {usuario.apellido or ''}".strip() if usuario else None,
            usuario_email=usuario.email if usuario else None,
            puntaje_confianza=t.puntaje_confianza,
            nivel=t.nivel,
            requiere_respuesta=t.requiere_respuesta,
            mensajes_no_leidos=t.mensajes_no_leidos,
            estado=t.estado,
            creado_en=t.creado_en.isoformat(),
        )


class MensajeSchema(BaseModel):
    id: str
    ticket_id: str
    autor_id: Optional[str] = None
    rol: str
    texto: str
    leido: bool
    creado_en: str

    @classmethod
    def from_model(cls, m):
        return cls(
            id=str(m.id),
            ticket_id=str(m.ticket_id),
            autor_id=str(m.autor_id) if m.autor_id else None,
            rol=m.rol,
            texto=m.texto,
            leido=m.leido,
            creado_en=m.creado_en.isoformat(),
        )


class EnviarMensajeBody(BaseModel):
    texto: str


# ── Rutas estáticas PRIMERO (antes de /{ticket_id}) ──────────────────────────

@router.get("/usuario/no-leidos")
def no_leidos(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get('_usuario_id', '')
    count = ticket_service.contar_no_leidos_usuario(db, usuario_id)
    return {"count": count}


@router.get("/usuario/mis-tickets", response_model=list[TicketSchema])
def mis_tickets(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get('_usuario_id', '')
    # usuario_id es string UUID — comparar como string directamente
    tickets = db.query(TicketVacio).filter(
        TicketVacio.usuario_id == usuario_id
    ).order_by(TicketVacio.creado_en.desc()).all()
    return [TicketSchema.from_model(t) for t in tickets]


# ── Rutas de admin ────────────────────────────────────────────────────────────

@router.get("", response_model=list[TicketSchema])
def listar_tickets(estado: Optional[str] = None, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('ver_validaciones'))):
    tickets = ticket_service.listar_tickets(db, estado)
    result = []
    for t in tickets:
        usuario = None
        if t.usuario_id and not t.usuario_id.startswith('invitado:'):
            try:
                usuario = db.query(Usuario).filter(Usuario.id == _uuid.UUID(t.usuario_id)).first()
            except Exception:
                pass
        result.append(TicketSchema.from_model(t, usuario))
    return result


@router.put("/{ticket_id}/revisar", response_model=TicketSchema)
def marcar_revisado(ticket_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('ver_validaciones'))):
    ticket = ticket_service.marcar_revisado(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return TicketSchema.from_model(ticket)


@router.delete("/{ticket_id}", status_code=204)
def eliminar_ticket(ticket_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('ver_validaciones'))):
    if not ticket_service.eliminar_ticket(db, ticket_id):
        raise HTTPException(status_code=404, detail="Ticket no encontrado")


# ── Mensajes por ticket ───────────────────────────────────────────────────────

@router.patch("/{ticket_id}/leer", status_code=200)
def marcar_ticket_leido(ticket_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Marca los mensajes del ticket como leidos para el usuario actual."""
    rol = 'admin' if current_user.get('_rol') == 'admin' else 'usuario'
    ticket_service.marcar_leidos(db, ticket_id, rol)
    return {"ok": True}


@router.get("/{ticket_id}/mensajes", response_model=list[MensajeSchema])
def listar_mensajes(ticket_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rol = 'admin' if current_user.get('_rol') == 'admin' else 'usuario'
    mensajes = ticket_service.listar_mensajes(db, ticket_id)
    ticket_service.marcar_leidos(db, ticket_id, rol)
    return [MensajeSchema.from_model(m) for m in mensajes]


@router.post("/{ticket_id}/mensajes", response_model=MensajeSchema)
def enviar_mensaje(ticket_id: str, body: EnviarMensajeBody, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rol = 'admin' if current_user.get('_rol') == 'admin' else 'usuario'
    autor_id = current_user.get('_usuario_id', '')
    msg = ticket_service.enviar_mensaje(db, ticket_id, autor_id, rol, body.texto)
    if not msg:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return MensajeSchema.from_model(msg)
