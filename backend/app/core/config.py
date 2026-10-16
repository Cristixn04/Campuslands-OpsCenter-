import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Campuslands OpsCenter API"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:campuslands_secret_2026@db:5432/campuslands_db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CAMPUS_LAT: float = float(os.getenv("CAMPUS_LAT", "7.0653"))
    CAMPUS_LON: float = float(os.getenv("CAMPUS_LON", "-73.0864"))
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
