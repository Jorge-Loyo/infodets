from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cognito_region: str
    cognito_user_pool_id: str
    cognito_client_id: str
    cognito_client_secret: str
    frontend_url: str
    cognito_domain: str
    cloudfront_url: str
    redirect_uri: str
    app_env: str = "development"
    secret_key: str

    @property
    def cognito_authority(self) -> str:
        return f"https://cognito-idp.{self.cognito_region}.amazonaws.com/{self.cognito_user_pool_id}"

    @property
    def cognito_metadata_url(self) -> str:
        return f"{self.cognito_authority}/.well-known/openid-configuration"

    class Config:
        env_file = ".env"


settings = Settings()
