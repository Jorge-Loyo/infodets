from fastapi import APIRouter
from app.api.v1.routes.auth_routes import router as auth_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth_router)
