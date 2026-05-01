import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.schemas.common import R_400, R_401, R_403, R_404, R_422
from app.services import noticia_service
from app.middleware.auth_middleware import require_permiso, get_current_user
from app.models.models import Noticia

router = APIRouter(prefix="/noticias", tags=["Noticias"])

UPLOAD_DIR = "uploads/noticias"
os.makedirs(UPLOAD_DIR, exist_ok=True)
EXTENSIONES_PERMITIDAS = {"jpg", "jpeg", "png", "gif", "webp"}


class NoticiaSchema(BaseModel):
    id: str
    titulo: str
    contenido: str
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    autor_nombre: Optional[str] = None
    autor_cargo: Optional[str] = None
    publicada: bool
    likes: int
    creado_en: str
    actualizado_en: str

    @classmethod
    def from_model(cls, n: "Noticia") -> "NoticiaSchema":
        return cls(
            id=str(n.id),
            titulo=n.titulo,
            contenido=n.contenido,
            categoria=n.categoria,
            imagen_url=n.imagen_url,
            autor_nombre=n.autor_nombre,
            autor_cargo=n.autor_cargo,
            publicada=n.publicada,
            likes=n.likes,
            creado_en=n.creado_en.isoformat(),
            actualizado_en=n.actualizado_en.isoformat(),
        )


class ConteoNoticias(BaseModel):
    count: int


@router.get(
    "",
    response_model=list[NoticiaSchema],
    summary="Listar noticias",
    description="Retorna todas las noticias. Con `solo_publicadas=true` filtra solo las publicadas.",
    responses={**R_401},
)
def listar_noticias(
    solo_publicadas: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return [NoticiaSchema.from_model(n) for n in noticia_service.listar(db, solo_publicadas)]


@router.get(
    "/nuevas/count",
    response_model=ConteoNoticias,
    summary="Contar noticias nuevas desde una fecha",
    description="Endpoint público. Retorna cuántas noticias publicadas hay desde la fecha ISO indicada.",
    responses={**R_400},
)
def contar_noticias_nuevas(desde: str, db: Session = Depends(get_db)):
    try:
        desde_dt = datetime.fromisoformat(desde)
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida — usar formato ISO 8601")
    count = db.query(Noticia).filter(
        Noticia.publicada == True,
        Noticia.creado_en > desde_dt,
    ).count()
    return {"count": count}


@router.post(
    "",
    response_model=NoticiaSchema,
    status_code=201,
    summary="Crear noticia",
    responses={
        201: {"description": "Noticia creada exitosamente"},
        **R_400,
        **R_401,
        **R_403,
        **R_422,
    },
)
async def crear_noticia(
    titulo: str = Form(...),
    contenido: str = Form(...),
    categoria: Optional[str] = Form(None),
    autor_nombre: Optional[str] = Form(None),
    autor_cargo: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_noticias")),
):
    imagen_url = None
    if imagen and imagen.filename:
        ext = imagen.filename.rsplit(".", 1)[-1].lower()
        if ext not in EXTENSIONES_PERMITIDAS:
            raise HTTPException(status_code=400, detail=f"Formato de imagen no permitido. Usar: {', '.join(EXTENSIONES_PERMITIDAS)}")
        nombre = f"{uuid.uuid4()}.{ext}"
        ruta = os.path.join(UPLOAD_DIR, nombre)
        with open(ruta, "wb") as f:
            f.write(await imagen.read())
        imagen_url = f"/uploads/noticias/{nombre}"

    noticia = noticia_service.crear(db, titulo, contenido, categoria, imagen_url, autor_nombre, autor_cargo)
    return NoticiaSchema.from_model(noticia)


@router.put(
    "/{noticia_id}",
    response_model=NoticiaSchema,
    summary="Actualizar noticia",
    responses={**R_400, **R_401, **R_403, **R_404, **R_422},
)
async def actualizar_noticia(
    noticia_id: str,
    titulo: Optional[str] = Form(None),
    contenido: Optional[str] = Form(None),
    categoria: Optional[str] = Form(None),
    autor_nombre: Optional[str] = Form(None),
    autor_cargo: Optional[str] = Form(None),
    publicada: Optional[str] = Form(None),  # recibe 'true'/'false' como string desde multipart
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_noticias")),
):
    imagen_url = None
    if imagen and imagen.filename:
        ext = imagen.filename.rsplit(".", 1)[-1].lower()
        nombre = f"{uuid.uuid4()}.{ext}"
        ruta = os.path.join(UPLOAD_DIR, nombre)
        with open(ruta, "wb") as f:
            f.write(await imagen.read())
        imagen_url = f"/uploads/noticias/{nombre}"

    publicada_bool = publicada.lower() == "true" if publicada is not None else None

    noticia = noticia_service.actualizar(
        db, noticia_id,
        titulo=titulo, contenido=contenido, categoria=categoria,
        autor_nombre=autor_nombre, autor_cargo=autor_cargo,
        publicada=publicada_bool, imagen_url=imagen_url,
    )
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return NoticiaSchema.from_model(noticia)


@router.delete(
    "/{noticia_id}",
    status_code=204,
    summary="Eliminar noticia",
    responses={**R_401, **R_403, **R_404},
)
def eliminar_noticia(
    noticia_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_noticias")),
):
    if not noticia_service.eliminar(db, noticia_id):
        raise HTTPException(status_code=404, detail="Noticia no encontrada")


@router.post(
    "/{noticia_id}/like",
    response_model=NoticiaSchema,
    summary="Dar o quitar like a una noticia",
    description="Con `sumar=true` suma un like, con `sumar=false` lo resta.",
    responses={**R_401, **R_404},
)
def like_noticia(
    noticia_id: str,
    sumar: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    noticia = noticia_service.toggle_like(db, noticia_id, sumar)
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return NoticiaSchema.from_model(noticia)
