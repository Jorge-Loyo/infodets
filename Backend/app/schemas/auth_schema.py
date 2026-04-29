from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class UsuarioSchema(BaseModel):
    id: str
    cognito_sub: Optional[str] = None
    email: str = ""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    cargo: Optional[str] = None
    institucion: Optional[str] = None
    dependencia: Optional[str] = None
    rol: str = "operador"
    perfil_id: Optional[str] = None

    @field_validator('id', 'perfil_id', mode='before')
    @classmethod
    def uuid_to_str(cls, v):
        return str(v) if v is not None else None

    class Config:
        from_attributes = True


class UsuarioActualizar(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    dni: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    cargo: Optional[str] = None
    institucion: Optional[str] = None
    dependencia: Optional[str] = None
    rol: Optional[str] = None


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSchema


class CallbackSchema(BaseModel):
    code: str
    state: Optional[str] = None
