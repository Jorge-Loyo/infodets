from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
import boto3
import re
import logging
from typing import Optional

from app.core.database import get_db
from app.core.settings import settings
from app.schemas.auth_schema import UsuarioSchema, UsuarioActualizar
from app.schemas.common import ErrorDetail, MensajeOk, R_400, R_401, R_403, R_404, R_422, R_500, R_503
from app.services import usuario_service, perfil_service as ps
from app.models.models import RolEnum
from app.middleware.auth_middleware import require_permiso, get_current_user
from pydantic import BaseModel, EmailStr

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


class DefaultPasswordResponse(BaseModel):
    default_password: str


class DefaultPasswordUpdate(BaseModel):
    password: str


# ── Perfil propio ─────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UsuarioSchema,
    summary="Obtener mi perfil",
    responses={**R_401, **R_404},
)
def obtener_mi_perfil(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put(
    "/me",
    response_model=UsuarioSchema,
    summary="Actualizar mi perfil",
    responses={**R_401, **R_404, **R_422},
)
def actualizar_mi_perfil(
    datos: UsuarioActualizar,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id")
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


# ── Gestión de usuarios (admin) ───────────────────────────────────────────────

@router.get(
    "",
    response_model=list[UsuarioSchema],
    summary="Listar todos los usuarios",
    responses={**R_401, **R_403},
)
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
    return usuario_service.listar_usuarios(db)


@router.post(
    "/invitar",
    response_model=UsuarioSchema,
    status_code=201,
    summary="Invitar nuevo usuario",
    description="Crea el usuario en la base de datos y envía email de bienvenida via n8n.",
    responses={
        201: {"description": "Usuario creado — recibirá email para activar su cuenta"},
        **R_400,
        **R_401,
        **R_403,
        **R_422,
    },
)
async def invitar_usuario(
    datos: UsuarioInvitar,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
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

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{settings.n8n_url}/webhook/invitar-usuario",
                    json={
                        "email": datos.email,
                        "nombre": datos.nombre or datos.email,
                        "login_url": settings.frontend_url,
                        "rol": datos.rol,
                    },
                )
        except Exception as e:
            logger.warning(f"[INVITAR] n8n no disponible, email no enviado: {e}")

        return usuario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{usuario_id}",
    response_model=UsuarioSchema,
    summary="Obtener usuario por ID",
    responses={**R_401, **R_403, **R_404},
)
def obtener_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put(
    "/{usuario_id}",
    response_model=UsuarioSchema,
    summary="Actualizar usuario (admin)",
    responses={**R_401, **R_403, **R_404, **R_422},
)
def actualizar_usuario(
    usuario_id: str,
    datos: UsuarioActualizar,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
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
    if datos.rol:
        ps.sincronizar_por_rol(db, usuario_id, datos.rol)
    return usuario


@router.delete(
    "/{usuario_id}",
    status_code=204,
    summary="Eliminar usuario",
    responses={**R_401, **R_403, **R_404},
)
def eliminar_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
    if not usuario_service.eliminar_usuario(db, usuario_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")


# ── Gestión de contraseñas ────────────────────────────────────────────────────

def _get_cognito_client():
    kwargs = {"region_name": settings.cognito_region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        if settings.aws_session_token:
            kwargs["aws_session_token"] = settings.aws_session_token
    return boto3.client("cognito-idp", **kwargs)


@router.post(
    "/{usuario_id}/blanquear-password",
    response_model=MensajeOk,
    status_code=200,
    summary="Blanquear contraseña de usuario",
    description="Resetea la contraseña del usuario a la contraseña por defecto configurada.",
    responses={**R_400, **R_401, **R_403, **R_404, **R_500, **R_503},
)
def blanquear_password(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("blanquear_password")),
):
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
            raise HTTPException(
                status_code=503,
                detail="No hay credenciales AWS configuradas. Contactá al administrador de la cuenta AWS.",
            )
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/config/default-password",
    response_model=DefaultPasswordResponse,
    status_code=200,
    summary="Ver contraseña por defecto",
    responses={**R_401, **R_403},
)
def obtener_default_password(
    current_user: dict = Depends(require_permiso("blanquear_password")),
):
    return {"default_password": settings.default_password}


@router.put(
    "/config/default-password",
    response_model=MensajeOk,
    status_code=200,
    summary="Actualizar contraseña por defecto",
    description="Debe tener al menos 8 caracteres con mayúscula, minúscula, número y símbolo.",
    responses={**R_400, **R_401, **R_403},
)
def actualizar_default_password(
    body: DefaultPasswordUpdate,
    current_user: dict = Depends(require_permiso("blanquear_password")),
):
    nueva = body.password.strip()
    if len(nueva) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if (
        not re.search(r"[A-Z]", nueva)
        or not re.search(r"[a-z]", nueva)
        or not re.search(r"\d", nueva)
        or not re.search(r"[^\w]", nueva)
    ):
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener mayúscula, minúscula, número y símbolo",
        )
    settings.default_password = nueva
    return {"ok": True, "mensaje": "Contraseña por defecto actualizada"}
