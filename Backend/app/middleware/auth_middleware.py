from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import get_cognito_public_keys, verify_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        public_keys = await get_cognito_public_keys()
        payload = verify_token(token, public_keys)
        return payload
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    rol = current_user.get("custom:rol", "operador")
    if rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido a administradores")
    return current_user
