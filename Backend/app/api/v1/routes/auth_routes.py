from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from app.core.settings import settings
from app.core.database import get_db
from app.services import usuario_service
from app.schemas.auth_schema import TokenSchema
from sqlalchemy.orm import Session
from pydantic import BaseModel
import boto3
import hmac
import hashlib
import base64
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class LoginRequest(BaseModel):
    email: str
    password: str


def _secret_hash(username: str) -> str:
    msg = username + settings.cognito_client_id
    dig = hmac.new(settings.cognito_client_secret.encode(), msg.encode(), hashlib.sha256).digest()
    return base64.b64encode(dig).decode()


def _make_jwt(usuario) -> str:
    payload = {
        "sub": str(usuario.id),
        "email": usuario.email,
        "rol": usuario.rol.value if hasattr(usuario.rol, 'value') else usuario.rol,
        "exp": datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


logger = __import__('logging').getLogger(__name__)


@router.post("/login", response_model=TokenSchema)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    cognito = boto3.client("cognito-idp", region_name=settings.cognito_region)
    try:
        resp = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": body.password,
                "SECRET_HASH": _secret_hash(email),
            },
            ClientId=settings.cognito_client_id,
        )
    except cognito.exceptions.NotAuthorizedException:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    except cognito.exceptions.UserNotFoundException:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    except cognito.exceptions.UserNotConfirmedException:
        raise HTTPException(status_code=403, detail="Tu cuenta no está confirmada. Revisá tu email")
    except cognito.exceptions.PasswordResetRequiredException:
        raise HTTPException(status_code=403, detail="Debés resetear tu contraseña. Revisá tu email")
    except cognito.exceptions.TooManyRequestsException:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Esperá unos minutos e intentá de nuevo")
    except Exception as e:
        logger.error(f"[LOGIN] Error Cognito: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al iniciar sesión")

    id_token = resp["AuthenticationResult"]["IdToken"]
    unverified = jwt.get_unverified_claims(id_token)
    cognito_sub = unverified.get("sub", "")
    groups = unverified.get("cognito:groups", [])
    rol = "admin" if "admin" in groups else "operador"

    usuario = usuario_service.obtener_usuario_por_cognito_sub(db, cognito_sub)
    if not usuario:
        usuario = usuario_service.obtener_usuario_por_email(db, email)
        if usuario and str(usuario.cognito_sub).startswith("pending_"):
            usuario.cognito_sub = cognito_sub
            db.commit()
            db.refresh(usuario)
    if not usuario:
        usuario = usuario_service.crear_usuario(db, cognito_sub=cognito_sub, email=email)

    token = _make_jwt(usuario)
    return {"access_token": token, "token_type": "bearer", "usuario": usuario}
