from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional
from app.core.database import get_db
from app.services import ticket_service
from app.middleware.auth_middleware import require_permiso

router = APIRouter(prefix="/tickets", tags=["Tickets"])


class TicketSchema(BaseModel):
    id: str
    pregunta: str
    usuario_id: Optional[str] = None
    puntaje_confianza: float
    estado: str
    creado_en: str

    @field_validator('id', mode='before')
    @classmethod
    def uuid_to_str(cls, v):
        return str(v) if v is not None else None

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, t):
        return cls(
            id=str(t.id),
            pregunta=t.pregunta,
            usuario_id=t.usuario_id,
            puntaje_confianza=t.puntaje_confianza,
            estado=t.estado,
            creado_en=t.creado_en.isoformat(),
        )


@router.get("", response_model=list[TicketSchema])
def listar_tickets(estado: Optional[str] = None, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('ver_validaciones'))):
    tickets = ticket_service.listar_tickets(db, estado)
    return [TicketSchema.from_model(t) for t in tickets]


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
