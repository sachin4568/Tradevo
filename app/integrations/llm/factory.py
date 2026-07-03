"""LLM provider factory.

Reads LLM_PROVIDER from configuration and returns the corresponding
LLMProvider implementation. Adding a new LLM backend requires:
1. A new implementation file (e.g., anthropic.py)
2. Adding the import and case to this factory

Zero changes to any business or AI module code are needed.
"""

import logging

from app.config import get_settings
from app.integrations.llm.base import LLMProvider

logger = logging.getLogger(__name__)


def create_llm_provider() -> LLMProvider | None:
    """Create the LLM provider based on configuration.

    Returns None when AI_PROVIDER is not 'mock' or an unknown value,
    allowing services to handle the unavailability gracefully.
    """
    ai_provider = get_settings().AI_PROVIDER
    settings = get_settings()

    if ai_provider == "mock":
        from app.integrations.llm.mock import MockLLMProvider
        return MockLLMProvider()

    if ai_provider == "live":
        llm_provider = settings.LLM_PROVIDER
        api_key = settings.get_provider_api_key(llm_provider)
        if not api_key and llm_provider != "ollama":
            logger.warning(
                "llm_factory_no_key provider=%s",
                llm_provider,
            )
            return None

        try:
            if llm_provider == "openai":
                from app.integrations.llm.openai_provider import OpenAIProvider
                return OpenAIProvider(
                    api_key=api_key,
                    model=settings.get_provider_model("openai"),
                    base_url=settings.OPENAI_BASE_URL,
                    timeout=settings.get_provider_timeout("openai"),
                )
            if llm_provider == "anthropic":
                from app.integrations.llm.anthropic_provider import AnthropicProvider
                return AnthropicProvider(
                    api_key=api_key,
                    model=settings.get_provider_model("anthropic"),
                    base_url=settings.ANTHROPIC_BASE_URL,
                    timeout=settings.get_provider_timeout("anthropic"),
                )
            if llm_provider in ("google", "gemini"):
                from app.integrations.llm.gemini_provider import GeminiProvider
                return GeminiProvider(
                    api_key=api_key,
                    model=settings.get_provider_model("gemini"),
                    timeout=settings.get_provider_timeout("gemini"),
                )
            if llm_provider == "openrouter":
                from app.integrations.llm.openrouter_provider import OpenRouterProvider
                return OpenRouterProvider(
                    api_key=api_key,
                    model=settings.get_provider_model("openrouter"),
                    base_url=settings.OPENROUTER_BASE_URL,
                    timeout=settings.get_provider_timeout("openrouter"),
                )
            if llm_provider == "ollama":
                from app.integrations.llm.ollama_provider import OllamaProvider
                return OllamaProvider(
                    model=settings.OLLAMA_MODEL,
                    base_url=settings.OLLAMA_BASE_URL,
                    timeout=settings.OLLAMA_TIMEOUT,
                )
        except ImportError:
            logger.warning("llm_factory_import_failed provider=%s", llm_provider)
        except Exception:
            logger.exception("llm_factory_error provider=%s", llm_provider)

    return None
