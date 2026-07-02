"""Cache configuration.

Controls AI cache behavior and future Redis integration.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class CacheSettings(BaseSettings):
    """Cache settings.

    Controls the AI response cache. The AI cache TTL can
    be overridden via AI_CACHE_TTL in AISettings.
    When Redis is integrated, these settings control the
    cache connection and behavior.
    """

    REDIS_URL: str | None = None
    REDIS_MAX_CONNECTIONS: int = 10
    CACHE_DEFAULT_TTL: int = 300

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")