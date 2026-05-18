import sys
import os

# Agregar el directorio Backend al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Variables de entorno mínimas para tests
os.environ.setdefault("COGNITO_REGION", "us-east-1")
os.environ.setdefault("COGNITO_USER_POOL_ID", "test")
os.environ.setdefault("COGNITO_CLIENT_ID", "test")
os.environ.setdefault("COGNITO_CLIENT_SECRET", "test")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ.setdefault("GROQ_API_KEY", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
