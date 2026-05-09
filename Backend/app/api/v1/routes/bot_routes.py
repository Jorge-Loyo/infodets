import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth_middleware import require_permiso, get_current_user
from app.models.models import BotIdentidad
from app.schemas.common import R_401, R_403

router = APIRouter(prefix="/bot", tags=["Bot Identidad"])


class BotIdentidadSchema(BaseModel):
    id: str
    nombre: str
    sexo: str
    personalidad: Optional[str] = None
    tono: str
    idioma: str
    institucion: Optional[str] = None
    descripcion: Optional[str] = None
    restricciones: Optional[str] = None
    imagen_url: Optional[str] = None
    actualizado_en: datetime

    class Config:
        from_attributes = True


class BotIdentidadUpdate(BaseModel):
    nombre: Optional[str] = None
    sexo: Optional[str] = None
    personalidad: Optional[str] = None
    tono: Optional[str] = None
    idioma: Optional[str] = None
    institucion: Optional[str] = None
    descripcion: Optional[str] = None
    restricciones: Optional[str] = None
    imagen_url: Optional[str] = None


def _get_or_create(db: Session) -> BotIdentidad:
    bot = db.query(BotIdentidad).first()
    if not bot:
        bot = BotIdentidad(id=uuid.uuid4(), actualizado_en=datetime.utcnow())
        db.add(bot)
        db.commit()
        db.refresh(bot)
    return bot


def _serializar(bot: BotIdentidad) -> dict:
    return {
        "id": str(bot.id),
        "nombre": bot.nombre,
        "sexo": bot.sexo,
        "personalidad": bot.personalidad,
        "tono": bot.tono,
        "idioma": bot.idioma,
        "institucion": bot.institucion,
        "descripcion": bot.descripcion,
        "restricciones": bot.restricciones,
        "imagen_url": bot.imagen_url,
        "actualizado_en": bot.actualizado_en,
    }


@router.get(
    "",
    response_model=BotIdentidadSchema,
    summary="Obtener identidad del bot",
    responses={**R_401},
)
def obtener_bot(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return _serializar(_get_or_create(db))


@router.put(
    "",
    response_model=BotIdentidadSchema,
    summary="Actualizar identidad del bot",
    responses={**R_401, **R_403},
)
def actualizar_bot(
    body: BotIdentidadUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_tablas")),
):
    bot = _get_or_create(db)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(bot, k, v)
    bot.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(bot)
    return _serializar(bot)
