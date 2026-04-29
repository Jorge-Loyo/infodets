import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import PermisoUsuario, RolEnum

PERMISOS_POR_ROL = {
    RolEnum.admin:    ['consulta', 'perfil', 'documentacion', 'noticias', 'dashboard'],
    RolEnum.operador: ['consulta', 'perfil', 'documentacion', 'noticias'],
    RolEnum.visor:    ['consulta', 'perfil'],
}

TODAS_LAS_SECCIONES = ['consulta', 'perfil', 'documentacion', 'noticias', 'dashboard']


def obtener_permisos(db: Session, usuario_id: str) -> dict[str, bool]:
    registros = db.query(PermisoUsuario).filter(PermisoUsuario.usuario_id == usuario_id).all()
    return {r.seccion: r.habilitado for r in registros}


def inicializar_permisos(db: Session, usuario_id: str, rol: RolEnum) -> None:
    """Crea los permisos por defecto según el rol si no existen."""
    existentes = {r.seccion for r in db.query(PermisoUsuario).filter(PermisoUsuario.usuario_id == usuario_id).all()}
    defaults = PERMISOS_POR_ROL.get(rol, ['consulta'])
    for seccion in TODAS_LAS_SECCIONES:
        if seccion not in existentes:
            db.add(PermisoUsuario(
                id=uuid.uuid4(),
                usuario_id=usuario_id,
                seccion=seccion,
                habilitado=seccion in defaults,
                actualizado_en=datetime.utcnow(),
            ))
    db.commit()


def actualizar_permisos(db: Session, usuario_id: str, permisos: dict[str, bool]) -> dict[str, bool]:
    """Actualiza o crea los permisos de un usuario."""
    for seccion, habilitado in permisos.items():
        registro = db.query(PermisoUsuario).filter(
            PermisoUsuario.usuario_id == usuario_id,
            PermisoUsuario.seccion == seccion,
        ).first()
        if registro:
            registro.habilitado = habilitado
            registro.actualizado_en = datetime.utcnow()
        else:
            db.add(PermisoUsuario(
                id=uuid.uuid4(),
                usuario_id=usuario_id,
                seccion=seccion,
                habilitado=habilitado,
                actualizado_en=datetime.utcnow(),
            ))
    db.commit()
    return obtener_permisos(db, usuario_id)
