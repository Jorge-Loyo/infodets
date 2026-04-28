from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth_schema import UsuarioSchema, UsuarioActualizar
from app.services import usuario_service
from app.models.models import RolEnum
from app.middleware.auth_middleware import require_admin, get_current_user
from app.services import perfil_service as ps

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/me", response_model=UsuarioSchema)
def obtener_mi_perfil(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cognito_sub = current_user.get("_cognito_sub") or current_user.get("sub")
    usuario = usuario_service.obtener_usuario_por_cognito_sub(db, cognito_sub)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/me", response_model=UsuarioSchema)
def actualizar_mi_perfil(datos: UsuarioActualizar, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cognito_sub = current_user.get("_cognito_sub") or current_user.get("sub")
    usuario = usuario_service.obtener_usuario_por_cognito_sub(db, cognito_sub)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    actualizado = usuario_service.actualizar_usuario(
        db, str(usuario.id),
        nombre=datos.nombre,
        apellido=datos.apellido,
        email=datos.email,
        dni=datos.dni,
        fecha_nacimiento=datos.fecha_nacimiento,
        cargo=datos.cargo,
        institucion=datos.institucion,
        dependencia=datos.dependencia,
    )
    return actualizado


@router.get("", response_model=list[UsuarioSchema])
def listar_usuarios(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    return usuario_service.listar_usuarios(db)


@router.get("/{usuario_id}", response_model=UsuarioSchema)
def obtener_usuario(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioSchema)
def actualizar_usuario(usuario_id: str, datos: UsuarioActualizar, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    rol = RolEnum(datos.rol) if datos.rol else None
    usuario = usuario_service.actualizar_usuario(
        db, usuario_id,
        nombre=datos.nombre,
        apellido=datos.apellido,
        rol=rol,
        email=datos.email,
        dni=datos.dni,
        fecha_nacimiento=datos.fecha_nacimiento,
        cargo=datos.cargo,
        institucion=datos.institucion,
        dependencia=datos.dependencia,
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # Si cambió el rol, sincronizar perfil y permisos automáticamente
    if datos.rol:
        ps.sincronizar_por_rol(db, usuario_id, datos.rol)
    return usuario


@router.delete("/{usuario_id}", status_code=204)
def eliminar_usuario(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    eliminado = usuario_service.eliminar_usuario(db, usuario_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
