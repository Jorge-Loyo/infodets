import httpx
from jose import jwt, JWTError
from app.core.settings import settings


async def get_cognito_public_keys() -> dict:
    jwks_url = f"{settings.cognito_authority}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        return response.json()


def verify_token(token: str, public_keys: dict) -> dict:
    try:
        header = jwt.get_unverified_header(token)
        key = next((k for k in public_keys["keys"] if k["kid"] == header["kid"]), None)
        if not key:
            raise ValueError("Clave pública no encontrada")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.cognito_client_id,
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Token inválido: {e}")


async def get_user_info(access_token: str) -> dict:
    userinfo_url = f"{settings.cognito_authority}/oauth2/userInfo"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()
