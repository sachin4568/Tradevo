"""Rate limiting configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class RateLimitSettings(BaseSettings):
    """Per-endpoint rate limiting settings.

    Rate limiting protects against abuse and ensures fair resource usage.
    Individual endpoint categories have specific limits defined in the API Design Document.
    """

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/hour"

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
