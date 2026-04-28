from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.services.auth_service import get_cognito_public_keys, verify_token, get_user_info
from app.services.usuario_service import obtener_usuario_por_cognito_sub, crear_usuario, actualizar_usuario
from app.models.models import RolEnum
from app.core.database import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> dict:
    token = credentials.credentials
    try:
        public_keys = await get_cognito_public_keys()
        payload = verify_token(token, public_keys)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    cognito_sub = payload.get("sub") or payload.get("username")
    grupos = payload.get("cognito:groups", [])
    rol = "admin" if "admin" in grupos else "operador"

    # Auto-registro y sincronización en RDS
    if cognito_sub and db:
        try:
            usuario = obtener_usuario_por_cognito_sub(db, cognito_sub)
            if not usuario:
                # Obtener email desde Cognito userInfo
                try:
                    user_info = await get_user_info(token)
                    email = user_info.get("email", "") or cognito_sub
                    nombre = user_info.get("name", None)
                except Exception:
                    email = cognito_sub
                    nombre = None
                usuario = crear_usuario(db, cognito_sub=cognito_sub, email=email, nombre=nombre)

            # Sincronizar rol en RDS si cambió
            rol_enum = RolEnum.admin if rol == "admin" else RolEnum.operador
            if usuario.rol != rol_enum:
                actualizar_usuario(db, str(usuario.id), rol=rol_enum)

        except Exception:
            pass  # falla silenciosamente si RDS no está disponible

    payload["_rol"] = rol
    payload["_cognito_sub"] = cognito_sub
    return payload


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("_rol") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido a administradores")
    return current_user


def require_rol(*roles: str):
    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("_rol") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Acceso restringido a: {', '.join(roles)}")
        return current_user
    return _check
