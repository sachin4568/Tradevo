"""AI subsystem configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    """AI provider and model configuration.

    AI_PROVIDER controls which AI mode is active:
    - 'mock': returns canned responses (development default)
    - 'live': routes through LLM provider for real AI generation

    LLM_PROVIDER selects the concrete LLM backend
    (openai, anthropic, google, ollama).
    """

    AI_PROVIDER: str = "mock"
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str | None = None
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 4096
    AI_TIMEOUT_SECONDS: int = 30
    AI_MAX_RETRIES: int = 3
    AI_CIRCUIT_BREAKER_THRESHOLD: int = 5
    AI_CIRCUIT_BREAKER_RECOVERY: int = 30

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
