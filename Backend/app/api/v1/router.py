from fastapi import APIRouter
from app.api.v1.routes.auth_routes import router as auth_router
from app.api.v1.routes.chat_routes import router as chat_router
from app.api.v1.routes.feedback_routes import router as feedback_router
from app.api.v1.routes.ingesta_routes import router as ingesta_router
from app.api.v1.routes.dashboard_routes import router as dashboard_router
from app.api.v1.routes.usuario_routes import router as usuario_router
from app.api.v1.routes.permiso_routes import router as permiso_router
from app.api.v1.routes.perfil_routes import router as perfil_router
from app.api.v1.routes.tabla_routes import router as tabla_router
from app.api.v1.routes.noticia_routes import router as noticia_router
from app.api.v1.routes.ticket_routes import router as ticket_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(feedback_router)
api_router.include_router(ingesta_router)
api_router.include_router(dashboard_router)
api_router.include_router(usuario_router)
api_router.include_router(permiso_router)
api_router.include_router(perfil_router)
api_router.include_router(tabla_router)
api_router.include_router(noticia_router)
api_router.include_router(ticket_router)
