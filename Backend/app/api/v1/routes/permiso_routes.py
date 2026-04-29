from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.services import permiso_service, usuario_service
from app.middleware.auth_middleware import require_admin, get_current_user

router = APIRouter(prefix="/permisos", tags=["Permisos"])


class PermisosActualizar(BaseModel):
    permisos: dict[str, bool]


@router.get("/{usuario_id}", response_model=dict[str, bool])
def obtener_permisos(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Permite admin o el propio usuario
    es_admin = current_user.get("_rol") == "admin"
    usuario_rds = usuario_service.obtener_usuario_por_cognito_sub(db, current_user.get("_cognito_sub", ""))
    es_propio = usuario_rds and str(usuario_rds.id) == usuario_id
    if not es_admin and not es_propio:
        raise HTTPException(status_code=403, detail="Sin acceso")
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    permisos = permiso_service.obtener_permisos(db, usuario_id)
    if not permisos:
        permiso_service.inicializar_permisos(db, usuario_id, usuario.rol)
        permisos = permiso_service.obtener_permisos(db, usuario_id)
    return permisos


@router.put("/{usuario_id}", response_model=dict[str, bool])
def actualizar_permisos(usuario_id: str, body: PermisosActualizar, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return permiso_service.actualizar_permisos(db, usuario_id, body.permisos)


@router.post("/inicializar/{usuario_id}", status_code=204)
def inicializar_permisos(usuario_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    permiso_service.inicializar_permisos(db, usuario_id, usuario.rol)
