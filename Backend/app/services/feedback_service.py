import uuid
from sqlalchemy.orm import Session
from app.models.models import ReporteFeedback, EstadoFeedbackEnum


def crear_feedback(db: Session, historial_id: str, es_correcto: bool, comentario: str | None = None) -> ReporteFeedback:
    feedback = ReporteFeedback(
        id=str(uuid.uuid4()),
        historial_id=historial_id,
        es_correcto=es_correcto,
        comentario=comentario,
        estado=EstadoFeedbackEnum.abierto,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def listar_feedback(db: Session) -> list[ReporteFeedback]:
    return db.query(ReporteFeedback).all()
