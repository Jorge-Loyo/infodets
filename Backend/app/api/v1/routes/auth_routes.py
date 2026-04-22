from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from app.core.cognito import build_authorize_url, exchange_code_for_token, LOGOUT_ENDPOINT
from app.core.settings import settings
from app.services.auth_service import get_user_info

router = APIRouter(prefix="/auth", tags=["Autenticación"], responses={404: {"message": "Not found"}})


@router.get("/login", status_code=302)
async def login():
    url = build_authorize_url(redirect_uri=settings.cloudfront_url)
    return RedirectResponse(url=url)
    raise HTTPException(status_code=404, detail="Not found")


@router.get("/callback", status_code=302)
async def authorize(code: str, state: str | None = None):
    token = await exchange_code_for_token(code, redirect_uri=settings.cloudfront_url)
    userinfo = await get_user_info(token["access_token"])

    redirect_url = (
        f"{settings.frontend_url}"
        f"?token={token['access_token']}"
        f"&email={userinfo.get('email', '')}"
        f"&nombre={userinfo.get('name', userinfo.get('email', ''))}"
        f"&sub={userinfo.get('sub', '')}"
    )
    return RedirectResponse(url=redirect_url)
    raise HTTPException(status_code=404, detail="Not found")


@router.get("/logout", status_code=302)
async def logout():
    url = (
        f"{LOGOUT_ENDPOINT}"
        f"?client_id={settings.cognito_client_id}"
        f"&logout_uri={settings.cloudfront_url}"
    )
    return RedirectResponse(url=url)
    raise HTTPException(status_code=404, detail="Not found")


@router.get("/me", status_code=200)
async def me(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    access_token = auth_header.split(" ")[1]
    return await get_user_info(access_token)
    raise HTTPException(status_code=404, detail="Not found")
