import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import PermisoUsuario

# Secciones frontend (visibilidad de menú)
SECCIONES_FRONTEND = ['consulta', 'perfil', 'documentacion', 'noticias', 'dashboard']

# Secciones backend (acciones en el sistema)
SECCIONES_BACKEND = [
    'gestionar_usuarios',
    'blanquear_password',
    'gestionar_documentos',
    'gestionar_noticias',
    'gestionar_tablas',
    'ver_validaciones',
]

TODAS_LAS_SECCIONES = SECCIONES_FRONTEND + SECCIONES_BACKEND

# Permisos por defecto para el perfil administrador
PERMISOS_ADMIN = {s: True for s in TODAS_LAS_SECCIONES}

# Permisos por defecto para perfil operador
PERMISOS_OPERADOR = {
    'consulta': True, 'perfil': True, 'documentacion': True,
    'noticias': True, 'dashboard': False,
    'gestionar_usuarios': False, 'blanquear_password': False,
    'gestionar_documentos': True, 'gestionar_noticias': False,
    'gestionar_tablas': False, 'ver_validaciones': False,
}

# Permisos por defecto para perfil visor
PERMISOS_VISOR = {s: False for s in TODAS_LAS_SECCIONES}
PERMISOS_VISOR.update({'consulta': True, 'perfil': True})


def obtener_permisos(db: Session, usuario_id: str) -> dict[str, bool]:
    registros = db.query(PermisoUsuario).filter(PermisoUsuario.usuario_id == usuario_id).all()
    return {r.seccion: r.habilitado for r in registros}


def tiene_permiso(db: Session, usuario_id: str, seccion: str) -> bool:
    registro = db.query(PermisoUsuario).filter(
        PermisoUsuario.usuario_id == usuario_id,
        PermisoUsuario.seccion == seccion,
    ).first()
    return registro.habilitado if registro else False


def inicializar_permisos(db: Session, usuario_id: str, rol=None) -> None:
    existentes = {r.seccion for r in db.query(PermisoUsuario).filter(PermisoUsuario.usuario_id == usuario_id).all()}
    defaults = PERMISOS_ADMIN if str(rol) == 'admin' else PERMISOS_OPERADOR if str(rol) == 'operador' else PERMISOS_VISOR
    for seccion in TODAS_LAS_SECCIONES:
        if seccion not in existentes:
            db.add(PermisoUsuario(
                id=uuid.uuid4(),
                usuario_id=usuario_id,
                seccion=seccion,
                habilitado=defaults.get(seccion, False),
                actualizado_en=datetime.utcnow(),
            ))
    db.commit()


def actualizar_permisos(db: Session, usuario_id: str, permisos: dict[str, bool]) -> dict[str, bool]:
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
