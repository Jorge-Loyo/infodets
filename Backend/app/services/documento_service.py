import uuid
from sqlalchemy.orm import Session
from app.models.models import Documento, EstadoDocumentoEnum


def crear_documento(db: Session, id: str, titulo: str, url_fuente: str, categoria: str | None = None, dependencia: str | None = None) -> Documento:
    documento = Documento(
        id=id,
        titulo=titulo,
        url_fuente=url_fuente,
        categoria=categoria,
        dependencia=dependencia,
        estado=EstadoDocumentoEnum.indexado,
    )
    db.add(documento)
    db.commit()
    db.refresh(documento)
    return documento


def listar_documentos(db: Session) -> list[Documento]:
    return db.query(Documento).all()


def eliminar_documento(db: Session, documento_id: str) -> bool:
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True
