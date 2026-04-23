from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cognito_region: str
    cognito_user_pool_id: str
    cognito_client_id: str
    cognito_client_secret: str
    cognito_domain: str
    frontend_url: str
    cloudfront_url: str
    redirect_uri: str
    app_env: str = "development"
    secret_key: str

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

    @property
    def cognito_authority(self) -> str:
        return f"https://cognito-idp.{self.cognito_region}.amazonaws.com/{self.cognito_user_pool_id}"

    @property
    def cognito_metadata_url(self) -> str:
        return f"{self.cognito_authority}/.well-known/openid-configuration"

    class Config:
        env_file = ".env"


settings = Settings()
