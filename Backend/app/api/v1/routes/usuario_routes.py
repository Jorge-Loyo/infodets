from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
from app.services import cloudinary_service
from app.models.models import RolEnum
from app.middleware.auth_middleware import require_permiso, get_current_user
from pydantic import BaseModel, EmailStr
from app.services import audit_service

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


class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nuevo: str


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


@router.post(
    "/me/foto",
    summary="Subir foto de perfil",
    responses={**R_401},
)
async def subir_foto_perfil(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    contenido = await archivo.read()
    url = cloudinary_service.upload_image(contenido, folder="infodets/perfiles")
    if usuario.foto_url:
        cloudinary_service.delete_image(usuario.foto_url)
    usuario.foto_url = url
    db.commit()
    return {"foto_url": url}


@router.delete(
    "/me/foto",
    summary="Eliminar foto de perfil",
    responses={**R_401},
)
def eliminar_foto_perfil(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.foto_url:
        cloudinary_service.delete_image(usuario.foto_url)
    usuario.foto_url = None
    db.commit()
    return {"ok": True}


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
        email = datos.email.strip().lower()

        # 1. Crear usuario en Cognito con contraseña por defecto
        cognito = _get_cognito_client()
        try:
            cognito.admin_create_user(
                UserPoolId=settings.cognito_user_pool_id,
                Username=email,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "email_verified", "Value": "true"},
                ],
                MessageAction="SUPPRESS",  # No enviar email de Cognito
            )
            # Setear contraseña permanente para evitar FORCE_CHANGE_PASSWORD
            cognito.admin_set_user_password(
                UserPoolId=settings.cognito_user_pool_id,
                Username=email,
                Password=settings.default_password,
                Permanent=True,
            )
        except cognito.exceptions.UsernameExistsException:
            raise ValueError(f"Ya existe un usuario en Cognito con el email {email}")
        except Exception as e:
            logger.error(f"[INVITAR] Error creando usuario en Cognito: {e}")
            raise HTTPException(status_code=503, detail=f"Error al crear usuario en Cognito: {e}")

        # 2. Crear usuario en la base de datos local
        usuario = usuario_service.invitar_usuario(
            db,
            email=email,
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

        # 3. Notificar via n8n (best-effort)
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{settings.n8n_url}/webhook/invitar-usuario",
                    json={
                        "email": email,
                        "nombre": datos.nombre or email,
                        "login_url": settings.frontend_url,
                        "rol": datos.rol,
                    },
                )
        except Exception as e:
            logger.warning(f"[INVITAR] n8n no disponible, email no enviado: {e}")

        audit_service.registrar(
            db, accion="crear", entidad="usuario",
            entidad_id=str(usuario.id), entidad_nombre=email,
            detalle=f"Usuario invitado con perfil_id={datos.perfil_id}",
            realizado_por_id=current_user.get("_usuario_id"),
            realizado_por_email=current_user.get("email"),
        )
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
    audit_service.registrar(
        db, accion="modificar", entidad="usuario",
        entidad_id=usuario_id, entidad_nombre=usuario.email,
        detalle=f"Campos actualizados: {', '.join(k for k, v in datos.model_dump(exclude_none=True).items())}",
        realizado_por_id=current_user.get("_usuario_id"),
        realizado_por_email=current_user.get("email"),
    )
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
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    email = usuario.email
    if not usuario_service.eliminar_usuario(db, usuario_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    audit_service.registrar(
        db, accion="eliminar", entidad="usuario",
        entidad_id=usuario_id, entidad_nombre=email,
        detalle="Usuario eliminado del sistema",
        realizado_por_id=current_user.get("_usuario_id"),
        realizado_por_email=current_user.get("email"),
    )


@router.post(
    "/me/cambiar-password",
    response_model=MensajeOk,
    status_code=200,
    summary="Cambiar mi contraseña",
    responses={**R_400, **R_401, **R_500},
)
def cambiar_mi_password(
    body: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    usuario_id = current_user.get("_usuario_id")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not usuario.cognito_sub or usuario.cognito_sub.startswith("pending_"):
        raise HTTPException(status_code=400, detail="El usuario aún no activó su cuenta")
    nueva = body.password_nuevo.strip()
    if len(nueva) < 8 or not re.search(r"[A-Z]", nueva) or not re.search(r"[a-z]", nueva) or not re.search(r"\d", nueva) or not re.search(r"[^\w]", nueva):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo")
    try:
        import hmac, hashlib, base64
        def get_secret_hash(username: str) -> str:
            msg = username + settings.cognito_client_id
            dig = hmac.new(settings.cognito_client_secret.encode('utf-8'), msg=msg.encode('utf-8'), digestmod=hashlib.sha256).digest()
            return base64.b64encode(dig).decode()
        cognito = _get_cognito_client()
        auth = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": usuario.email,
                "PASSWORD": body.password_actual,
                "SECRET_HASH": get_secret_hash(usuario.email),
            },
            ClientId=settings.cognito_client_id,
        )
        access_token = auth["AuthenticationResult"]["AccessToken"]
        cognito.change_password(
            PreviousPassword=body.password_actual,
            ProposedPassword=nueva,
            AccessToken=access_token,
        )
        return {"ok": True, "mensaje": "Contraseña actualizada correctamente"}
    except cognito.exceptions.NotAuthorizedException:
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    except Exception as e:
        logger.error(f"[CAMBIO_PASSWORD] Error: {e}")
        raise HTTPException(status_code=500, detail="No se pudo cambiar la contraseña")


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
        audit_service.registrar(
            db, accion="blanquear_password", entidad="usuario",
            entidad_id=str(usuario.id), entidad_nombre=usuario.email,
            detalle="Contraseña blanqueada a valor por defecto",
            realizado_por_id=current_user.get("_usuario_id"),
            realizado_por_email=current_user.get("email"),
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
