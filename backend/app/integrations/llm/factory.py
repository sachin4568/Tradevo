"""LLM provider factory.

Reads LLM_PROVIDER from configuration and returns the corresponding
LLMProvider implementation. Adding a new LLM backend requires:
1. A new implementation file (e.g., anthropic.py)
2. Adding the import and case to this factory

Zero changes to any business or AI module code are needed.
"""

from app.config import get_settings
from app.integrations.llm.base import LLMProvider


def create_llm_provider() -> LLMProvider | None:
    """Create the LLM provider based on configuration.

    Returns None when AI_PROVIDER is not 'mock' or an unknown value,
    allowing services to handle the unavailability gracefully.
    """
    ai_provider = get_settings().AI_PROVIDER

    if ai_provider == "mock":
        from app.integrations.llm.mock import MockLLMProvider
        return MockLLMProvider()

    # Future providers:
    # if ai_provider == "live":
    #     llm_provider = get_settings().LLM_PROVIDER
    #     if llm_provider == "openai":
    #         from app.integrations.llm.openai_provider import OpenAIProvider
    #         return OpenAIProvider()
    #     if llm_provider == "anthropic":
    #         from app.integrations.llm.anthropic_provider import AnthropicProvider
    #         return AnthropicProvider()

    return None