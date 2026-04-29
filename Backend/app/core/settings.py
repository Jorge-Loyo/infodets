from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cognito_region: str
    cognito_user_pool_id: str
    cognito_client_id: str
    cognito_client_secret: str
    frontend_url: str
    app_env: str = "development"
    secret_key: str

    # Google Gemini
    gemini_api_key: str = ""
    gemini_generation_key: str = ""

    # Groq (fallback)
    groq_api_key: str = ""

    # Base de datos
    db_host: str = ""
    db_port: int = 5432
    db_name: str = "infodets"
    db_user: str = ""
    db_password: str = ""
    database_url: str = ""

    # n8n
    n8n_url: str = ""
    n8n_user: str = ""
    n8n_password: str = ""

    # Qdrant
    qdrant_url: str = "http://172.31.40.141:6333"
    qdrant_collection: str = "infodets_docs"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
