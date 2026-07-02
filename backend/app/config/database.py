"""Database connection and pool configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):
    """PostgreSQL database settings.

    Uses asyncpg driver for async operations via SQLAlchemy.
    Pool settings control connection management for concurrent requests.
    """

    DATABASE_URL: str = "postgresql+asyncpg://tradevo:tradevo@localhost:5432/tradevo"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
