"""Cache configuration (reserved for future Redis integration)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class CacheSettings(BaseSettings):
    """Cache settings.

    Currently reserved. When Redis is integrated, these settings
    will control the cache connection and behavior.
    """

    REDIS_URL: str | None = None

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
