from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
import boto3
from app.core.database import get_db
from app.core.settings import settings
from app.schemas.auth_schema import UsuarioSchema, UsuarioActualizar
from app.services import usuario_service
from app.models.models import RolEnum
from app.middleware.auth_middleware import require_permiso, get_current_user
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
    perfil_id: str  # obligatorio


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
def listar_usuarios(db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_usuarios'))):
    return usuario_service.listar_usuarios(db)


@router.get("/{usuario_id}", response_model=UsuarioSchema)
def obtener_usuario(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_usuarios'))):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioSchema)
def actualizar_usuario(usuario_id: str, datos: UsuarioActualizar, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_usuarios'))):
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
def eliminar_usuario(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_usuarios'))):
    eliminado = usuario_service.eliminar_usuario(db, usuario_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")


def _get_cognito_client():
    kwargs = {"region_name": settings.cognito_region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        if settings.aws_session_token:
            kwargs["aws_session_token"] = settings.aws_session_token
    return boto3.client("cognito-idp", **kwargs)


@router.post("/{usuario_id}/blanquear-password", status_code=200)
def blanquear_password(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('blanquear_password'))):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not usuario.cognito_sub or usuario.cognito_sub.startswith("pending_"):
        raise HTTPException(status_code=400, detail="El usuario aún no activó su cuenta en Cognito")
    try:
        cognito = _get_cognito_client()
        cognito.admin_set_user_password(
            UserPoolId=settings.cognito_user_pool_id,
            Username=usuario.email,
            Password=settings.default_password,
            Permanent=True,
        )
        return {"ok": True, "mensaje": f"Contraseña blanqueada para {usuario.email}"}
    except Exception as e:
        logger.error(f"[BLANQUEO] Error: {e}")
        if "credentials" in str(e).lower() or "NoCredentialsError" in type(e).__name__:
            raise HTTPException(status_code=503, detail="No hay credenciales AWS configuradas. Contactá al administrador de la cuenta AWS.")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/default-password", status_code=200)
def obtener_default_password(current_user: dict = Depends(require_permiso('blanquear_password'))):
    return {"default_password": settings.default_password}


@router.put("/config/default-password", status_code=200)
def actualizar_default_password(body: dict, current_user: dict = Depends(require_permiso('blanquear_password'))):
    nueva = body.get("password", "").strip()
    if len(nueva) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    import re
    if not re.search(r'[A-Z]', nueva) or not re.search(r'[a-z]', nueva) or not re.search(r'\d', nueva) or not re.search(r'[^\w]', nueva):
        raise HTTPException(status_code=400, detail="La contraseña debe tener mayúscula, minúscula, número y símbolo")
    settings.default_password = nueva
    return {"ok": True, "default_password": nueva}
async def invitar_usuario(datos: UsuarioInvitar, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_usuarios'))):
    try:
        usuario = usuario_service.invitar_usuario(
            db,
            email=datos.email.strip().lower(),
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
