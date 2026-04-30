from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.services import tabla_service
from app.middleware.auth_middleware import require_admin, get_current_user

router = APIRouter(prefix="/tablas", tags=["Tablas"])


class TablaValorSchema(BaseModel):
    id: str
    tabla_id: str
    valor: str
    activo: bool
    orden: int

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_safe(cls, obj):
        return cls(id=str(obj.id), tabla_id=obj.tabla_id, valor=obj.valor, activo=obj.activo, orden=obj.orden)


class ValorCrear(BaseModel):
    valor: str


class ValorActualizar(BaseModel):
    valor: Optional[str] = None
    activo: Optional[bool] = None


@router.get("/disponibles", response_model=list[str])
def listar_tablas(db: Session = Depends(get_db)):
    return tabla_service.listar_tablas_disponibles(db)


@router.get("/{tabla_id}", response_model=list[TablaValorSchema])
def listar_valores(tabla_id: str, solo_activos: bool = False, db: Session = Depends(get_db)):
    items = tabla_service.listar_por_tabla(db, tabla_id, solo_activos)
    return [TablaValorSchema.from_orm_safe(i) for i in items]


@router.post("/{tabla_id}", response_model=TablaValorSchema, status_code=201)
def crear_valor(tabla_id: str, body: ValorCrear, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    item = tabla_service.crear_valor(db, tabla_id, body.valor)
    return TablaValorSchema.from_orm_safe(item)


@router.put("/{tabla_id}/{item_id}", response_model=TablaValorSchema)
def actualizar_valor(tabla_id: str, item_id: str, body: ValorActualizar, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    item = tabla_service.actualizar_valor(db, item_id, body.valor, body.activo)
    if not item:
        raise HTTPException(status_code=404, detail="Valor no encontrado")
    return TablaValorSchema.from_orm_safe(item)


@router.delete("/{tabla_id}/{item_id}", status_code=204)
def eliminar_valor(tabla_id: str, item_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    if not tabla_service.eliminar_valor(db, item_id):
        raise HTTPException(status_code=404, detail="Valor no encontrado")
