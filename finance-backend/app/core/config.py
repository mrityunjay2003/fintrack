from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Finance Tracker API"
    DATABASE_URL: str = "sqlite+aiosqlite:///./finance.db"
    
    # Can be parsed from a JSON string in the .env file
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
