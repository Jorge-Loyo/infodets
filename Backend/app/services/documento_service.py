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
    return db.query(Documento).order_by(Documento.creado_en.desc()).all()


def listar_documentos_publico(db: Session, limite: int = 6) -> list[Documento]:
    return (
        db.query(Documento)
        .filter(Documento.estado == EstadoDocumentoEnum.indexado)
        .order_by(Documento.creado_en.desc())
        .limit(limite)
        .all()
    )


def eliminar_documento(db: Session, documento_id: str) -> bool:
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True
