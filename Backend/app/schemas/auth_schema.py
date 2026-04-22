from pydantic import BaseModel, EmailStr
from typing import Optional


class UsuarioSchema(BaseModel):
    id: str
    email: EmailStr
    nombre: Optional[str] = None
    rol: str = "operador"


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSchema


class CallbackSchema(BaseModel):
    code: str
    state: Optional[str] = None
