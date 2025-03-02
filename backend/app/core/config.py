from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "YouTube Digest"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "youtube_digest")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/youtube_digest")
    
    # CORS settings
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    @property
    def has_openai_key(self) -> bool:
        return bool(self.OPENAI_API_KEY)
    
    @property
    def has_google_key(self) -> bool:
        return bool(self.GOOGLE_API_KEY)
    
    @property
    def allowed_origins(self) -> List[str]:
        return self.CORS_ORIGINS.split(",")

settings = Settings()
