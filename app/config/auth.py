"""Authentication and JWT configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    """JWT authentication settings.

    Implements dual-token system:
    - Access tokens: short-lived (15 min), used for API authentication
    - Refresh tokens: long-lived (7 days), used to obtain new access tokens
    """

    JWT_SECRET_KEY: str = "change-me-in-production-min-32-chars-long!!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
