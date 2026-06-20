from fastapi import APIRouter, HTTPException, Depends
from app.core.settings import settings
from app.core.database import get_db
from app.services import usuario_service
from app.schemas.auth_schema import TokenSchema
from app.schemas.common import R_400, R_401, R_403, R_422, R_500
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
import bcrypt
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class LoginRequest(BaseModel):
    email: str
    password: str


def _make_jwt(usuario) -> str:
    payload = {
        "sub": str(usuario.id),
        "email": usuario.email,
        "rol": usuario.rol.value if hasattr(usuario.rol, 'value') else usuario.rol,
        "exp": datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _login_cognito(email: str, password: str):
    """Intenta autenticar contra Cognito. Retorna cognito_sub o None."""
    import hmac as hmac_mod
    import hashlib
    import base64

    try:
        import boto3
    except ImportError:
        return None

    if not settings.cognito_client_id or not settings.aws_access_key_id:
        return None

    def secret_hash(username: str) -> str:
        msg = username + settings.cognito_client_id
        dig = hmac_mod.new(settings.cognito_client_secret.encode(), msg.encode(), hashlib.sha256).digest()
        return base64.b64encode(dig).decode()

    kwargs = {"region_name": settings.cognito_region}
    if settings.aws_access_key_id:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        if settings.aws_session_token:
            kwargs["aws_session_token"] = settings.aws_session_token

    try:
        cognito = boto3.client("cognito-idp", **kwargs)
        resp = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password,
                "SECRET_HASH": secret_hash(email),
            },
            ClientId=settings.cognito_client_id,
        )
        id_token = resp["AuthenticationResult"]["IdToken"]
        unverified = jwt.get_unverified_claims(id_token)
        return unverified.get("sub", "")
    except Exception as e:
        logger.debug(f"[LOGIN] Cognito fallback failed: {type(e).__name__}: {e}")
        return None


@router.post(
    "/login",
    response_model=TokenSchema,
    status_code=200,
    summary="Iniciar sesión",
    description="Autentica al usuario con credenciales locales (o Cognito como fallback).",
    responses={
        200: {"description": "Login exitoso"},
        **R_400, **R_401, **R_403, **R_422, **R_500,
    },
)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = body.email.strip().lower()

    # 1. Buscar usuario en DB
    usuario = usuario_service.obtener_usuario_por_email(db, email)

    # 2. Si tiene password_hash, autenticar localmente
    if usuario and usuario.password_hash:
        if not _verify_password(body.password, usuario.password_hash):
            raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
        token = _make_jwt(usuario)
        return {"access_token": token, "token_type": "bearer", "usuario": usuario}

    # 3. Fallback: intentar con Cognito
    cognito_sub = _login_cognito(email, body.password)
    if cognito_sub:
        if not usuario:
            usuario = usuario_service.obtener_usuario_por_cognito_sub(db, cognito_sub)
        if not usuario:
            usuario = usuario_service.crear_usuario(db, cognito_sub=cognito_sub, email=email)
        elif str(usuario.cognito_sub).startswith("pending_"):
            usuario.cognito_sub = cognito_sub
            db.commit()
            db.refresh(usuario)
        # Migrar: guardar password_hash para futuros logins locales
        usuario.password_hash = _hash_password(body.password)
        db.commit()
        token = _make_jwt(usuario)
        return {"access_token": token, "token_type": "bearer", "usuario": usuario}

    # 4. Si el usuario existe pero no tiene hash, probar con default password
    if usuario and not usuario.password_hash:
        if body.password == settings.default_password:
            usuario.password_hash = _hash_password(body.password)
            db.commit()
            token = _make_jwt(usuario)
            return {"access_token": token, "token_type": "bearer", "usuario": usuario}

    raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
