"""AI subsystem configuration.

Production-ready settings for all AI/LLM providers.
Supports per-provider API keys, model selection, timeouts,
and retry/circuit-breaker tuning.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    """AI provider and model configuration.

    AI_PROVIDER controls which AI mode is active:
    - 'mock': returns canned responses (development default)
    - 'live': routes through LLM provider for real AI generation

    LLM_PROVIDER selects the concrete LLM backend
    (openai, anthropic, gemini, openrouter, ollama).
    """

    # ─── Primary Selection ───
    AI_PROVIDER: str = "mock"
    LLM_PROVIDER: str = "openai"

    # ─── OpenAI ───
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_BASE_URL: str | None = None
    OPENAI_TIMEOUT: int = 60

    # ─── Anthropic ───
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_BASE_URL: str | None = None
    ANTHROPIC_TIMEOUT: int = 60

    # ─── Gemini ───
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_TIMEOUT: int = 60

    # ─── OpenRouter ───
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "openai/gpt-4o"
    OPENROUTER_BASE_URL: str | None = None
    OPENROUTER_TIMEOUT: int = 60

    # ─── Ollama (local) ───
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_TIMEOUT: int = 120

    # ─── Legacy fallback keys (used when per-provider key not set) ───
    LLM_API_KEY: str | None = None
    LLM_MODEL: str = "gpt-4o"

    # ─── Generation Defaults ───
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 4096

    # ─── Resilience ───
    AI_TIMEOUT_SECONDS: int = 30
    AI_MAX_RETRIES: int = 3
    AI_CIRCUIT_BREAKER_THRESHOLD: int = 5
    AI_CIRCUIT_BREAKER_RECOVERY: int = 30

    # ─── Cache ───
    AI_CACHE_ENABLED: bool = True
    AI_CACHE_TTL: int = 300
    AI_CACHE_MAX_SIZE: int = 1000

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")

    def get_provider_api_key(self, provider: str) -> str | None:
        """Get the API key for a specific provider.

        Checks per-provider key first, falls back to LLM_API_KEY.
        """
        key_map = {
            "openai": self.OPENAI_API_KEY,
            "anthropic": self.ANTHROPIC_API_KEY,
            "google": self.GEMINI_API_KEY,
            "gemini": self.GEMINI_API_KEY,
            "openrouter": self.OPENROUTER_API_KEY,
            "ollama": None,  # Ollama has no API key
        }
        return key_map.get(provider) or self.LLM_API_KEY

    def get_provider_model(self, provider: str) -> str:
        """Get the model name for a specific provider."""
        model_map = {
            "openai": self.OPENAI_MODEL,
            "anthropic": self.ANTHROPIC_MODEL,
            "google": self.GEMINI_MODEL,
            "gemini": self.GEMINI_MODEL,
            "openrouter": self.OPENROUTER_MODEL,
            "ollama": self.OLLAMA_MODEL,
        }
        return model_map.get(provider) or self.LLM_MODEL

    def get_provider_timeout(self, provider: str) -> int:
        """Get the timeout for a specific provider."""
        timeout_map = {
            "openai": self.OPENAI_TIMEOUT,
            "anthropic": self.ANTHROPIC_TIMEOUT,
            "google": self.GEMINI_TIMEOUT,
            "gemini": self.GEMINI_TIMEOUT,
            "openrouter": self.OPENROUTER_TIMEOUT,
            "ollama": self.OLLAMA_TIMEOUT,
        }
        return timeout_map.get(provider) or self.AI_TIMEOUT_SECONDS
