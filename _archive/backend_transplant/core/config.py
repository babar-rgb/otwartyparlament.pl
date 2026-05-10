import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(ENV_PATH)

class Config:
    """PostgreSQL database configuration - reads from .env"""
    DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME = os.getenv("POSTGRES_DB", "otwarty_parlament")
    DB_USER = os.getenv("POSTGRES_USER", "kajtek")
    DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_db_uri(cls):
        # Support cloud providers that set DATABASE_URL
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")

        if cls.DB_PASSWORD:
            return f"postgresql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
        return f"postgresql://{cls.DB_USER}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"

config = Config()

