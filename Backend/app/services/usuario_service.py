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


def actualizar_usuario(db: Session, usuario_id: str, nombre: str | None = None, apellido: str | None = None, rol: RolEnum | None = None, email: str | None = None, dni: str | None = None, fecha_nacimiento: str | None = None, cargo: str | None = None, institucion: str | None = None, dependencia: str | None = None) -> Usuario | None:
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
    if nombre is not None: usuario.nombre = nombre
    if apellido is not None: usuario.apellido = apellido
    if rol is not None: usuario.rol = rol
    if email is not None and email: usuario.email = email
    if dni is not None: usuario.dni = dni
    if fecha_nacimiento is not None: usuario.fecha_nacimiento = fecha_nacimiento
    if cargo is not None: usuario.cargo = cargo
    if institucion is not None: usuario.institucion = institucion
    if dependencia is not None: usuario.dependencia = dependencia
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
