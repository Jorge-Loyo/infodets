import cloudinary
import cloudinary.uploader
from app.core.settings import settings

# Configurar al importar el módulo
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload_image(file_bytes: bytes, folder: str = "infodets") -> str:
    """Sube imagen a Cloudinary y retorna la URL pública."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
    )
    return result["secure_url"]


def delete_image(url: str) -> bool:
    """Elimina imagen de Cloudinary por su URL. Retorna True si se eliminó."""
    if not url or "cloudinary" not in url:
        return False
    try:
        parts = url.split("/upload/")
        if len(parts) < 2:
            return False
        path = parts[1]
        if path.startswith("v") and "/" in path:
            first_slash = path.index("/")
            path = path[first_slash + 1:]
        public_id = path.rsplit(".", 1)[0]
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception:
        return False
