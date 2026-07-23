from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Perito OS"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    LOGS_DIR: Path = BASE_DIR / "logs"

    DATABASE_URL: str = "postgresql+psycopg2://perito_os:perito_os@localhost:5432/perito_os"

    SECRET_KEY: str = "troque-esta-chave-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESET_SENHA_EXPIRE_MINUTES: int = 30

    FRONTEND_URL: str = "http://localhost:5173"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Perito OS <nao-responda@peritoos.com.br>"

    REDIS_URL: str = "redis://localhost:6379/0"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "perito_os"
    MINIO_SECRET_KEY: str = "troque-esta-chave-em-producao"
    MINIO_BUCKET: str = "perito-os"
    MINIO_SECURE: bool = False

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Inteligência Artificial (RF015) — provedor Google Gemini.
    # A chave NÃO fica versionada; defina GEMINI_API_KEY em backend/.env.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBED_MODEL: str = "gemini-embedding-001"


settings = Settings()
