import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "GiveNearby"
    PROJECT_TAGLINE: str = "Donate Anything. Help Someone Nearby."
    API_V1_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = "givenearby_super_secret_production_key_change_in_prod_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./givenearby.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "*"
    ]
    
    # Location Privacy
    LOCATION_PRIVACY_FUZZ_KM: float = 1.2  # Approximate radius for public listings
    
    # Handover Settings
    OTP_LENGTH: int = 6
    OTP_EXPIRY_HOURS: int = 48
    
    # NVIDIA NIM AI Integration (Optional - Gracefully falls back to heuristic engine)
    NVIDIA_API_KEY: str = ""
    NVIDIA_MODEL: str = "meta/llama-3.2-11b-vision-instruct"
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()
