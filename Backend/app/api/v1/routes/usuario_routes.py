from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
from app.core.database import get_db
from app.core.settings import settings
from app.schemas.auth_schema import UsuarioSchema, UsuarioActualizar
from app.services import usuario_service
from app.models.models import RolEnum
from app.middleware.auth_middleware import require_admin, get_current_user
from app.services import perfil_service as ps
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


class UsuarioInvitar(BaseModel):
    email: EmailStr
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    rol: str = "operador"
    dni: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    cargo: Optional[str] = None
    institucion: Optional[str] = None
    dependencia: Optional[str] = None
    perfil_id: Optional[str] = None


@router.get("/me", response_model=UsuarioSchema)
def obtener_mi_perfil(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get("sub")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/me", response_model=UsuarioSchema)
def actualizar_mi_perfil(datos: UsuarioActualizar, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    usuario_id = current_user.get("sub")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
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


@router.post("/invitar", response_model=UsuarioSchema, status_code=201)
async def invitar_usuario(datos: UsuarioInvitar, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        usuario = usuario_service.invitar_usuario(
            db,
            email=datos.email,
            nombre=datos.nombre,
            apellido=datos.apellido,
            rol=datos.rol,
            dni=datos.dni,
            fecha_nacimiento=datos.fecha_nacimiento,
            cargo=datos.cargo,
            institucion=datos.institucion,
            dependencia=datos.dependencia,
            perfil_id=datos.perfil_id,
        )
        if datos.perfil_id:
            ps.asignar_perfil_a_usuario(db, str(usuario.id), datos.perfil_id)

        # Notificar via n8n para enviar email de bienvenida
        login_url = f"{settings.frontend_url}"
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{settings.n8n_url}/webhook/invitar-usuario",
                    json={
                        "email": datos.email,
                        "nombre": datos.nombre or datos.email,
                        "login_url": login_url,
                        "rol": datos.rol,
                    },
                )
        except Exception as e:
            logger.warning(f"[INVITAR] n8n no disponible, email no enviado: {e}")

        return usuario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
