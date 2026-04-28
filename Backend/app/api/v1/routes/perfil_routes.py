import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.services import perfil_service
from app.middleware.auth_middleware import require_admin

router = APIRouter(prefix="/perfiles", tags=["Perfiles"])


class PerfilSchema(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str] = None
    color: str
    rol: Optional[str] = None
    permisos: dict[str, bool] = {}
    total_usuarios: int = 0

    class Config:
        from_attributes = True


class PerfilCrear(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    color: str = "blue"
    rol: Optional[str] = None
    permisos: dict[str, bool] = {}


class PerfilActualizar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    color: Optional[str] = None
    rol: Optional[str] = None
    permisos: Optional[dict[str, bool]] = None


class AsignarPerfil(BaseModel):
    perfil_id: Optional[str] = None


def _serializar(perfil, db) -> dict:
    return {
        "id": str(perfil.id),
        "nombre": perfil.nombre,
        "descripcion": perfil.descripcion,
        "color": perfil.color,
        "rol": perfil.rol,
        "permisos": {p.seccion: p.habilitado for p in perfil.permisos},
        "total_usuarios": perfil_service.contar_usuarios_por_perfil(db, str(perfil.id)),
    }


@router.get("", response_model=list[PerfilSchema])
def listar_perfiles(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    perfiles = perfil_service.listar_perfiles(db)
    return [_serializar(p, db) for p in perfiles]


@router.post("", response_model=PerfilSchema, status_code=201)
def crear_perfil(body: PerfilCrear, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    perfil = perfil_service.crear_perfil(db, body.nombre, body.descripcion, body.color, body.rol, body.permisos)
    return _serializar(perfil, db)


@router.put("/{perfil_id}", response_model=PerfilSchema)
def actualizar_perfil(perfil_id: str, body: PerfilActualizar, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    perfil = perfil_service.actualizar_perfil(db, perfil_id, body.nombre, body.descripcion, body.color, body.rol, body.permisos)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return _serializar(perfil, db)


@router.delete("/{perfil_id}", status_code=204)
def eliminar_perfil(perfil_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    if not perfil_service.eliminar_perfil(db, perfil_id):
        raise HTTPException(status_code=404, detail="Perfil no encontrado")


@router.post("/asignar/{usuario_id}", status_code=200)
def asignar_perfil(usuario_id: str, body: AsignarPerfil, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    if not perfil_service.asignar_perfil_a_usuario(db, usuario_id, body.perfil_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"ok": True}
