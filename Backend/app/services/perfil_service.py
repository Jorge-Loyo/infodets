import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Perfil, PerfilPermiso, Usuario, PermisoUsuario, RolEnum

TODAS_LAS_SECCIONES = ['consulta', 'perfil', 'documentacion', 'noticias', 'dashboard']


def listar_perfiles(db: Session) -> list[Perfil]:
    return db.query(Perfil).all()


def obtener_perfil(db: Session, perfil_id: str) -> Perfil | None:
    return db.query(Perfil).filter(Perfil.id == perfil_id).first()


def obtener_perfil_por_rol(db: Session, rol: str) -> Perfil | None:
    return db.query(Perfil).filter(Perfil.rol == rol).first()


def crear_perfil(db: Session, nombre: str, descripcion: str | None, color: str, rol: str | None, permisos: dict[str, bool]) -> Perfil:
    perfil = Perfil(
        id=uuid.uuid4(),
        nombre=nombre,
        descripcion=descripcion,
        color=color,
        rol=rol,
        creado_en=datetime.utcnow(),
    )
    db.add(perfil)
    db.flush()
    for seccion in TODAS_LAS_SECCIONES:
        db.add(PerfilPermiso(
            id=uuid.uuid4(),
            perfil_id=perfil.id,
            seccion=seccion,
            habilitado=permisos.get(seccion, False),
        ))
    db.commit()
    db.refresh(perfil)
    return perfil


def actualizar_perfil(db: Session, perfil_id: str, nombre: str | None, descripcion: str | None, color: str | None, rol: str | None, permisos: dict[str, bool] | None) -> Perfil | None:
    perfil = obtener_perfil(db, perfil_id)
    if not perfil:
        return None
    if nombre: perfil.nombre = nombre
    if descripcion is not None: perfil.descripcion = descripcion
    if color: perfil.color = color
    if rol is not None: perfil.rol = rol
    if permisos is not None:
        for p in perfil.permisos:
            if p.seccion in permisos:
                p.habilitado = permisos[p.seccion]
        # Sincronizar permisos a todos los usuarios con este perfil
        _sincronizar_permisos_usuarios(db, perfil_id, permisos)
    db.commit()
    db.refresh(perfil)
    return perfil


def eliminar_perfil(db: Session, perfil_id: str) -> bool:
    perfil = obtener_perfil(db, perfil_id)
    if not perfil:
        return False
    db.delete(perfil)
    db.commit()
    return True


def asignar_perfil_a_usuario(db: Session, usuario_id: str, perfil_id: str | None) -> bool:
    """Asigna un perfil al usuario y copia sus permisos y rol automáticamente."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        return False

    usuario.perfil_id = perfil_id

    if perfil_id:
        perfil = obtener_perfil(db, perfil_id)
        if perfil:
            # Copiar rol del perfil al usuario
            if perfil.rol:
                try:
                    usuario.rol = RolEnum(perfil.rol)
                except ValueError:
                    pass
            # Copiar permisos del perfil al usuario
            permisos_perfil = {p.seccion: p.habilitado for p in perfil.permisos}
            _aplicar_permisos_usuario(db, usuario_id, permisos_perfil)

    db.commit()
    return True


def sincronizar_por_rol(db: Session, usuario_id: str, rol: str) -> None:
    """Cuando se cambia el rol de un usuario, busca el perfil de ese rol y copia sus permisos."""
    perfil = obtener_perfil_por_rol(db, rol)
    if perfil:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if usuario:
            usuario.perfil_id = perfil.id
        permisos_perfil = {p.seccion: p.habilitado for p in perfil.permisos}
        _aplicar_permisos_usuario(db, usuario_id, permisos_perfil)
        db.commit()


def _aplicar_permisos_usuario(db: Session, usuario_id: str, permisos: dict[str, bool]) -> None:
    for seccion, habilitado in permisos.items():
        registro = db.query(PermisoUsuario).filter(
            PermisoUsuario.usuario_id == usuario_id,
            PermisoUsuario.seccion == seccion,
        ).first()
        if registro:
            registro.habilitado = habilitado
        else:
            db.add(PermisoUsuario(
                id=uuid.uuid4(),
                usuario_id=usuario_id,
                seccion=seccion,
                habilitado=habilitado,
                actualizado_en=datetime.utcnow(),
            ))


def _sincronizar_permisos_usuarios(db: Session, perfil_id: str, permisos: dict[str, bool]) -> None:
    """Cuando se editan los permisos de un perfil, actualiza todos los usuarios con ese perfil."""
    usuarios = db.query(Usuario).filter(Usuario.perfil_id == perfil_id).all()
    for usuario in usuarios:
        _aplicar_permisos_usuario(db, str(usuario.id), permisos)


def contar_usuarios_por_perfil(db: Session, perfil_id: str) -> int:
    return db.query(Usuario).filter(Usuario.perfil_id == perfil_id).count()
