from sqlalchemy.orm import Session
from app.models.models import UrlOficial


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
