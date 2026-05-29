import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth_middleware import require_permiso, get_current_user
from app.models.models import ConfiguracionSistema
from app.schemas.common import R_401, R_403

router = APIRouter(prefix="/sistema", tags=["Configuración Sistema"])

UPLOAD_DIR = "uploads/sistema"
os.makedirs(UPLOAD_DIR, exist_ok=True)
EXTENSIONES_PERMITIDAS = {"jpg", "jpeg", "png", "gif", "webp", "svg"}


class TemaSchema(BaseModel):
    header_color: str = "#ffffff"
    paleta_color: str = "blue"
    tipografia: str = "Plus Jakarta Sans"
    logo_size: int = 32
    color_scheme: str = "light"
    color_sidebar: str = ""
    color_texto: str = ""
    color_boton: str = ""
    color_fondo: str = ""
    color_tarjeta: str = ""
    tema_activo: str = "Estándar"


def _get_or_create(db: Session) -> ConfiguracionSistema:
    config = db.query(ConfiguracionSistema).first()
    if not config:
        config = ConfiguracionSistema(id=1, actualizado_en=datetime.utcnow())
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get(
    "",
    summary="Obtener configuración del sistema (logo + tema)",
    responses={**R_401},
)
def obtener_config(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    config = _get_or_create(db)
    return {
        "logo_url": config.logo_url,
        "header_color": config.header_color,
        "paleta_color": config.paleta_color,
        "tipografia": config.tipografia,
        "logo_size": config.logo_size,
        "color_scheme": config.color_scheme,
        "color_sidebar": config.color_sidebar,
        "color_texto": config.color_texto,
        "color_boton": config.color_boton,
        "color_fondo": config.color_fondo,
        "color_tarjeta": config.color_tarjeta,
        "tema_activo": config.tema_activo,
    }


@router.put(
    "/tema",
    summary="Actualizar tema global del sistema (solo admin)",
    responses={**R_401, **R_403},
)
def actualizar_tema(
    tema: TemaSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_tablas")),
):
    config = _get_or_create(db)
    config.header_color = tema.header_color
    config.paleta_color = tema.paleta_color
    config.tipografia = tema.tipografia
    config.logo_size = tema.logo_size
    config.color_scheme = tema.color_scheme
    config.color_sidebar = tema.color_sidebar
    config.color_texto = tema.color_texto
    config.color_boton = tema.color_boton
    config.color_fondo = tema.color_fondo
    config.color_tarjeta = tema.color_tarjeta
    config.tema_activo = tema.tema_activo
    config.actualizado_en = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post(
    "/logo",
    summary="Subir logo del sistema",
    responses={**R_401, **R_403},
)
async def subir_logo(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_tablas")),
):
    ext = (archivo.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        return JSONResponse(status_code=400, content={"detail": f"Formato no permitido. Usar: {', '.join(EXTENSIONES_PERMITIDAS)}"})

    nombre = f"logo_{uuid.uuid4()}.{ext}"
    ruta = os.path.join(UPLOAD_DIR, nombre)
    with open(ruta, "wb") as f:
        f.write(await archivo.read())

    url = f"/uploads/sistema/{nombre}"
    config = _get_or_create(db)
    if config.logo_url:
        ruta_anterior = config.logo_url.lstrip("/")
        if os.path.exists(ruta_anterior):
            os.unlink(ruta_anterior)
    config.logo_url = url
    config.actualizado_en = datetime.utcnow()
    db.commit()
    return {"logo_url": url}


@router.delete(
    "/logo",
    summary="Eliminar logo del sistema",
    responses={**R_401, **R_403},
)
def eliminar_logo(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_tablas")),
):
    config = _get_or_create(db)
    if config.logo_url:
        ruta = config.logo_url.lstrip("/")
        if os.path.exists(ruta):
            os.unlink(ruta)
    config.logo_url = None
    config.actualizado_en = datetime.utcnow()
    db.commit()
    return {"ok": True}
