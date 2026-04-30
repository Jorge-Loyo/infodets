import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.settings import settings
from app.services.usuario_service import obtener_usuario_por_id
from app.services.permiso_service import tiene_permiso
from app.core.database import get_db

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    usuario_id = payload.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    payload["_usuario_id"] = str(usuario.id)
    payload["_perfil_id"] = str(usuario.perfil_id) if usuario.perfil_id else None
    # Mantener _rol por compatibilidad temporal
    payload["_rol"] = usuario.rol.value if hasattr(usuario.rol, 'value') else str(usuario.rol)
    payload["_cognito_sub"] = usuario.cognito_sub
    return payload


def require_permiso(seccion: str):
    """Dependency que verifica si el usuario tiene un permiso específico."""
    async def _check(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> dict:
        usuario_id = current_user.get("_usuario_id")
        if not usuario_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sin identificación")
        if not tiene_permiso(db, usuario_id, seccion):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tenés permiso para: {seccion}",
            )
        return current_user
    return _check


# Alias para compatibilidad — usa permiso 'gestionar_usuarios'
async def require_admin(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    usuario_id = current_user.get("_usuario_id")
    if not usuario_id or not tiene_permiso(db, usuario_id, "gestionar_usuarios"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido")
    return current_user


def require_rol(*roles: str):
    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("_rol", "") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Acceso restringido a: {', '.join(roles)}")
        return current_user
    return _check
