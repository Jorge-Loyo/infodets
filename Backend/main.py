from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import api_router
from app.core.settings import settings
import os


app = FastAPI(
    title="INFODETS API",
    description="Sistema de Gestión de Conocimiento Dinámico",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.cloudfront_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

os.makedirs("uploads/noticias", exist_ok=True)
os.makedirs("uploads/documentos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health", tags=["Sistema"] ,status_code=200)
async def health():
    return {"status": "ok", "env": settings.app_env}
    raise HTTPException(status_code=404, detail="Not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.app_env == "development")
