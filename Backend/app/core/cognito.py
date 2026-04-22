import httpx
from app.core.settings import settings

COGNITO_AUTHORITY = settings.cognito_authority
TOKEN_ENDPOINT = f"https://{settings.cognito_domain}/oauth2/token"
AUTHORIZE_ENDPOINT = f"https://{settings.cognito_domain}/oauth2/authorize"
LOGOUT_ENDPOINT = f"https://{settings.cognito_domain}/logout"


def build_authorize_url(redirect_uri: str) -> str:
    params = {
        "client_id": settings.cognito_client_id,
        "response_type": "code",
        "scope": "phone openid email",
        "redirect_uri": redirect_uri,
    }
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{AUTHORIZE_ENDPOINT}?{qs}"


async def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKEN_ENDPOINT,
            data={
                "grant_type": "authorization_code",
                "client_id": settings.cognito_client_id,
                "client_secret": settings.cognito_client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        return response.json()
