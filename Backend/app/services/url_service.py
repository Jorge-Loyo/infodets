import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, Session
from app.core.database import Base


class UrlOficial(Base):
    __tablename__ = "urls_oficiales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    url: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String, nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


def listar(db: Session, solo_activas: bool = False) -> list[UrlOficial]:
    q = db.query(UrlOficial)
    if solo_activas:
        q = q.filter(UrlOficial.activa == True)
    return q.order_by(UrlOficial.creado_en.desc()).all()


def crear(db: Session, url: str, descripcion: str | None) -> UrlOficial:
    item = UrlOficial(url=url.strip(), descripcion=descripcion)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def actualizar(db: Session, url_id: str, activa: bool | None, descripcion: str | None) -> UrlOficial | None:
    item = db.query(UrlOficial).filter(UrlOficial.id == url_id).first()
    if not item:
        return None
    if activa is not None:
        item.activa = activa
    if descripcion is not None:
        item.descripcion = descripcion
    db.commit()
    db.refresh(item)
    return item


def eliminar(db: Session, url_id: str) -> bool:
    item = db.query(UrlOficial).filter(UrlOficial.id == url_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def get_urls_activas(db: Session) -> list[str]:
    return [u.url for u in listar(db, solo_activas=True)]
