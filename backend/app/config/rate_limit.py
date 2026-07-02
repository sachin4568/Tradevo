"""Rate limiting configuration.

Production-ready rate limiting with per-category limits
and configurable storage backend.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class RateLimitSettings(BaseSettings):
    """Per-endpoint rate limiting settings.

    Rate limiting protects against abuse and ensures fair
    resource usage. Individual endpoint categories have
    specific limits.
    """

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/hour"
    RATE_LIMIT_AUTH: str = "20/minute"
    RATE_LIMIT_AI: str = "30/hour"
    RATE_LIMIT_MARKET: str = "60/minute"
    RATE_LIMIT_TRADE: str = "30/minute"
    RATE_LIMIT_WINDOW: int = 3600

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")