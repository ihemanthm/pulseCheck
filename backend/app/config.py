from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables"""
    
    # App
    app_name: str = "PulseCheck"
    app_env: str = "development"
    log_level: str = "INFO"
    
    # Database
    database_url: str
    
    # Bolna API
    bolna_api_key: str
    bolna_agent_id: str
    bolna_base_url: str = "https://api.bolna.api"
    
    # AWS S3
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "ap-south-1"
    s3_bucket_name: str
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    jwt_refresh_expiration_days: int = 7
    
    # Frontend
    frontend_url: str
    
    # Webhook
    webhook_secret: Optional[str] = None
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    def __init__(self, **values):
        super().__init__(**values)
        # Adapt database URL for async pg driver
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)


settings = Settings()
