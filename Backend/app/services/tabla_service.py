import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import TablaValor


def listar_por_tabla(db: Session, tabla_id: str, solo_activos: bool = False) -> list[TablaValor]:
    q = db.query(TablaValor).filter(TablaValor.tabla_id == tabla_id)
    if solo_activos:
        q = q.filter(TablaValor.activo == True)
    return q.order_by(TablaValor.orden, TablaValor.valor).all()


def listar_tablas_disponibles(db: Session) -> list[str]:
    rows = db.query(TablaValor.tabla_id).distinct().all()
    return [r[0] for r in rows]


def crear_valor(db: Session, tabla_id: str, valor: str) -> TablaValor:
    max_orden = db.query(TablaValor).filter(TablaValor.tabla_id == tabla_id).count()
    item = TablaValor(id=uuid.uuid4(), tabla_id=tabla_id, valor=valor, activo=True, orden=max_orden, creado_en=datetime.utcnow())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def actualizar_valor(db: Session, item_id: str, valor: str | None, activo: bool | None) -> TablaValor | None:
    item = db.query(TablaValor).filter(TablaValor.id == item_id).first()
    if not item:
        return None
    if valor is not None:
        item.valor = valor
    if activo is not None:
        item.activo = activo
    db.commit()
    db.refresh(item)
    return item


def eliminar_valor(db: Session, item_id: str) -> bool:
    item = db.query(TablaValor).filter(TablaValor.id == item_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
