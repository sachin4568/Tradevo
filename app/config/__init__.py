from functools import lru_cache

from pydantic_settings import SettingsConfigDict

from app.config.ai import AISettings
from app.config.app import AppSettings
from app.config.auth import AuthSettings
from app.config.cache import CacheSettings
from app.config.database import DatabaseSettings
from app.config.integrations import IntegrationsSettings
from app.config.observability import ObservabilitySettings
from app.config.rate_limit import RateLimitSettings


class Settings(
    AppSettings,
    DatabaseSettings,
    AuthSettings,
    AISettings,
    IntegrationsSettings,
    RateLimitSettings,
    CacheSettings,
    ObservabilitySettings,
):
    """Root settings class composing all domain-specific settings.

    Configuration values are resolved in priority order:
    1. Environment variables (highest)
    2. .env file values
    3. Default values defined in each settings class
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance.

    Uses lru_cache to ensure the Settings object is created only once
    per process, avoiding repeated file I/O and validation overhead.
    """
    return Settings()
