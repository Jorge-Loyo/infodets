import uuid
from sqlalchemy.orm import Session
from app.models.models import Usuario, RolEnum


def obtener_usuario_por_id(db: Session, usuario_id: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def obtener_usuario_por_cognito_sub(db: Session, cognito_sub: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.cognito_sub == cognito_sub).first()


def listar_usuarios(db: Session) -> list[Usuario]:
    return db.query(Usuario).all()


def crear_usuario(db: Session, cognito_sub: str, email: str, nombre: str | None = None) -> Usuario:
    usuario = Usuario(
        id=str(uuid.uuid4()),
        cognito_sub=cognito_sub,
        email=email,
        nombre=nombre,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def actualizar_usuario(db: Session, usuario_id: str, nombre: str | None = None, rol: RolEnum | None = None) -> Usuario | None:
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
    if nombre is not None:
        usuario.nombre = nombre
    if rol is not None:
        usuario.rol = rol
    db.commit()
    db.refresh(usuario)
    return usuario


def eliminar_usuario(db: Session, usuario_id: str) -> bool:
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return False
    db.delete(usuario)
    db.commit()
    return True
