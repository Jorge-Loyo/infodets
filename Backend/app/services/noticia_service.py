import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Noticia


def listar(db: Session, solo_publicadas: bool = False) -> list[Noticia]:
    q = db.query(Noticia)
    if solo_publicadas:
        q = q.filter(Noticia.publicada == True)
    return q.order_by(Noticia.creado_en.desc()).all()


def obtener(db: Session, noticia_id: str) -> Noticia | None:
    return db.query(Noticia).filter(Noticia.id == noticia_id).first()


def crear(db: Session, titulo: str, contenido: str, categoria: str | None,
          imagen_url: str | None, autor_nombre: str | None, autor_cargo: str | None) -> Noticia:
    noticia = Noticia(
        id=uuid.uuid4(),
        titulo=titulo,
        contenido=contenido,
        categoria=categoria,
        imagen_url=imagen_url,
        autor_nombre=autor_nombre,
        autor_cargo=autor_cargo,
        publicada=False,
        likes=0,
        creado_en=datetime.utcnow(),
        actualizado_en=datetime.utcnow(),
    )
    db.add(noticia)
    db.commit()
    db.refresh(noticia)
    return noticia


def actualizar(db: Session, noticia_id: str, **kwargs) -> Noticia | None:
    noticia = obtener(db, noticia_id)
    if not noticia:
        return None
    for k, v in kwargs.items():
        if v is not None:
            setattr(noticia, k, v)
    noticia.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(noticia)
    return noticia


def eliminar(db: Session, noticia_id: str) -> bool:
    noticia = obtener(db, noticia_id)
    if not noticia:
        return False
    db.delete(noticia)
    db.commit()
    return True


def toggle_like(db: Session, noticia_id: str, sumar: bool) -> Noticia | None:
    noticia = obtener(db, noticia_id)
    if not noticia:
        return None
    noticia.likes = max(0, noticia.likes + (1 if sumar else -1))
    db.commit()
    db.refresh(noticia)
    return noticia
