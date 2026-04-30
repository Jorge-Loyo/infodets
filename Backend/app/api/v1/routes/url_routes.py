from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.services import url_service
from app.middleware.auth_middleware import require_permiso

router = APIRouter(prefix="/urls", tags=["URLs Oficiales"])


class UrlSchema(BaseModel):
    id: str
    url: str
    descripcion: Optional[str] = None
    activa: bool
    creado_en: str

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, u):
        return cls(id=str(u.id), url=u.url, descripcion=u.descripcion, activa=u.activa, creado_en=u.creado_en.isoformat())


class UrlCrear(BaseModel):
    url: str
    descripcion: Optional[str] = None


class UrlActualizar(BaseModel):
    activa: Optional[bool] = None
    descripcion: Optional[str] = None


@router.get("", response_model=list[UrlSchema])
def listar(db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_documentos'))):
    return [UrlSchema.from_model(u) for u in url_service.listar(db)]


@router.post("", response_model=UrlSchema, status_code=201)
def crear(body: UrlCrear, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_documentos'))):
    try:
        return UrlSchema.from_model(url_service.crear(db, body.url, body.descripcion))
    except Exception:
        raise HTTPException(status_code=400, detail="La URL ya existe")


@router.put("/{url_id}", response_model=UrlSchema)
def actualizar(url_id: str, body: UrlActualizar, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_documentos'))):
    item = url_service.actualizar(db, url_id, body.activa, body.descripcion)
    if not item:
        raise HTTPException(status_code=404, detail="URL no encontrada")
    return UrlSchema.from_model(item)


@router.delete("/{url_id}", status_code=204)
def eliminar(url_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_permiso('gestionar_documentos'))):
    if not url_service.eliminar(db, url_id):
        raise HTTPException(status_code=404, detail="URL no encontrada")
