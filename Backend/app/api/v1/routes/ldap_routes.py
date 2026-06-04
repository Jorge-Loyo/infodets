"""
HU-033: Integración con LDAP/Active Directory.
Sincroniza usuarios desde un directorio corporativo.
Los grupos de AD se mapean a perfiles de INFODETS.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.settings import settings
from app.middleware.auth_middleware import require_permiso
from app.services import usuario_service, perfil_service
from app.services import audit_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/ldap", tags=["LDAP / Active Directory"])


class LdapConfig(BaseModel):
    server_url: str  # ldap://ad.empresa.com:389
    bind_dn: str  # CN=admin,DC=empresa,DC=com
    bind_password: str
    search_base: str  # OU=Users,DC=empresa,DC=com
    search_filter: str = "(objectClass=person)"
    email_attr: str = "mail"
    nombre_attr: str = "givenName"
    apellido_attr: str = "sn"
    grupo_attr: str = "memberOf"
    grupo_perfil_map: dict[str, str] = {}  # {"CN=Admins": "uuid-perfil-admin", "CN=Operadores": "uuid-perfil-operador"}


class LdapSyncResult(BaseModel):
    total_encontrados: int
    creados: int
    actualizados: int
    errores: int
    detalle_errores: list[dict] = []


@router.post(
    "/sync",
    response_model=LdapSyncResult,
    summary="Sincronizar usuarios desde LDAP/Active Directory",
    description=(
        "Conecta al servidor LDAP, busca usuarios y los sincroniza con la base de datos local. "
        "Los grupos del directorio se mapean a perfiles de INFODETS según la configuración."
    ),
)
async def sincronizar_ldap(
    config: LdapConfig,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
    try:
        import ldap3
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="El módulo ldap3 no está instalado. Ejecutar: pip install ldap3"
        )

    resultado = LdapSyncResult(total_encontrados=0, creados=0, actualizados=0, errores=0)

    try:
        server = ldap3.Server(config.server_url, get_info=ldap3.ALL)
        conn = ldap3.Connection(server, config.bind_dn, config.bind_password, auto_bind=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"No se pudo conectar al servidor LDAP: {e}")

    try:
        conn.search(
            config.search_base,
            config.search_filter,
            attributes=[config.email_attr, config.nombre_attr, config.apellido_attr, config.grupo_attr],
        )

        resultado.total_encontrados = len(conn.entries)

        for entry in conn.entries:
            email = str(getattr(entry, config.email_attr, "")).strip().lower()
            if not email or "@" not in email:
                continue

            nombre = str(getattr(entry, config.nombre_attr, "")) or ""
            apellido = str(getattr(entry, config.apellido_attr, "")) or ""
            grupos = getattr(entry, config.grupo_attr, [])
            if hasattr(grupos, 'values'):
                grupos = list(grupos.values)

            # Determinar perfil basado en grupos
            perfil_id = None
            for grupo in grupos:
                grupo_str = str(grupo)
                for patron, pid in config.grupo_perfil_map.items():
                    if patron.lower() in grupo_str.lower():
                        perfil_id = pid
                        break
                if perfil_id:
                    break

            try:
                existente = usuario_service.obtener_usuario_por_email(db, email)
                if existente:
                    # Actualizar nombre/apellido si cambió
                    if nombre and existente.nombre != nombre:
                        existente.nombre = nombre
                    if apellido and existente.apellido != apellido:
                        existente.apellido = apellido
                    if perfil_id and str(existente.perfil_id) != perfil_id:
                        perfil_service.asignar_perfil_a_usuario(db, str(existente.id), perfil_id)
                    db.commit()
                    resultado.actualizados += 1
                else:
                    usuario = usuario_service.invitar_usuario(
                        db,
                        email=email,
                        nombre=nombre,
                        apellido=apellido,
                        rol="operador",
                        perfil_id=perfil_id or "",
                    )
                    if perfil_id:
                        perfil_service.asignar_perfil_a_usuario(db, str(usuario.id), perfil_id)
                    resultado.creados += 1
            except Exception as e:
                resultado.errores += 1
                resultado.detalle_errores.append({"email": email, "error": str(e)})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la sincronización: {e}")
    finally:
        conn.unbind()

    audit_service.registrar(
        db, accion="sync_ldap", entidad="usuario",
        entidad_id=None,
        detalle=f"LDAP sync: {resultado.creados} creados, {resultado.actualizados} actualizados, {resultado.errores} errores",
        realizado_por_id=current_user.get("_usuario_id"),
        realizado_por_email=current_user.get("email"),
    )

    return resultado


@router.post(
    "/test-connection",
    summary="Probar conexión LDAP",
    description="Verifica que se puede conectar al servidor LDAP con las credenciales proporcionadas.",
)
async def test_ldap_connection(
    config: LdapConfig,
    current_user: dict = Depends(require_permiso("gestionar_usuarios")),
):
    try:
        import ldap3
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="El módulo ldap3 no está instalado. Ejecutar: pip install ldap3"
        )

    try:
        server = ldap3.Server(config.server_url, get_info=ldap3.ALL)
        conn = ldap3.Connection(server, config.bind_dn, config.bind_password, auto_bind=True)
        conn.unbind()
        return {"ok": True, "mensaje": f"Conexión exitosa a {config.server_url}"}
    except Exception as e:
        return {"ok": False, "mensaje": f"Error de conexión: {e}"}
