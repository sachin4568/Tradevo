"""AI Provider Factory (BA-009b).

Creates and configures LLM provider instances based on application
settings. Replaces the simple factory in integrations/llm/factory.py
with a full provider factory that supports:
- Configuration-driven provider instantiation
- Automatic circuit breaker setup from config
- Provider manager population

The factory is a pure function — it reads settings, creates providers,
and returns an initialized AIProviderManager. No side effects.
"""

from __future__ import annotations

import logging

from app.config import get_settings
from app.integrations.base import CircuitBreaker
from app.modules.ai.provider_manager import AIProviderManager

logger = logging.getLogger(__name__)


def create_provider_manager() -> AIProviderManager:
    """Create and populate a ProviderManager from application settings.

    Reads AI_PROVIDER and LLM_PROVIDER config to determine which
    provider(s) to instantiate. Configures circuit breakers from
    AI_CIRCUIT_BREAKER_THRESHOLD and AI_CIRCUIT_BREAKER_RECOVERY.

    Returns:
        Configured AIProviderManager with at least one provider.
    """
    settings = get_settings()
    manager = AIProviderManager()

    threshold = settings.AI_CIRCUIT_BREAKER_THRESHOLD
    recovery = settings.AI_CIRCUIT_BREAKER_RECOVERY

    if settings.AI_PROVIDER == "mock":
        from app.integrations.llm.mock import MockLLMProvider
        cb = CircuitBreaker(failure_threshold=threshold, recovery_timeout=recovery)
        manager.register(
            "mock",
            MockLLMProvider(),
            priority=100,
            circuit_breaker=cb,
        )
        logger.info("provider_factory_mock_registered")
        return manager

    # Live provider configuration
    llm_provider = settings.LLM_PROVIDER
    cb = CircuitBreaker(failure_threshold=threshold, recovery_timeout=recovery)

    if llm_provider == "openai":
        _register_openai(manager, cb, settings)
    elif llm_provider == "anthropic":
        _register_anthropic(manager, cb, settings)
    elif llm_provider == "google":
        _register_google(manager, cb, settings)

    # Always register mock as fallback (lowest priority)
    from app.integrations.llm.mock import MockLLMProvider
    fallback_cb = CircuitBreaker(failure_threshold=threshold * 2, recovery_timeout=recovery)
    manager.register(
        "mock",
        MockLLMProvider(),
        priority=999,
        circuit_breaker=fallback_cb,
    )

    if manager.provider_count == 1:
        logger.warning(
            "provider_factory_only_mock configured=%s reason=live provider not available",
            llm_provider,
        )

    return manager


def _register_openai(
    manager: AIProviderManager,
    cb: CircuitBreaker,
    settings,
) -> None:
    """Register an OpenAI provider if the API key is available."""
    if not settings.LLM_API_KEY:
        logger.warning("provider_factory_openai_no_key")
        return
    try:
        from app.integrations.llm.openai_provider import OpenAIProvider
        provider = OpenAIProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
        )
        manager.register("openai", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_openai_registered")
    except ImportError:
        logger.warning("provider_factory_openai_import_failed")
    except Exception:
        logger.exception("provider_factory_openai_error")


def _register_anthropic(
    manager: AIProviderManager,
    cb: CircuitBreaker,
    settings,
) -> None:
    """Register an Anthropic provider if the API key is available."""
    if not settings.LLM_API_KEY:
        logger.warning("provider_factory_anthropic_no_key")
        return
    try:
        from app.integrations.llm.anthropic_provider import AnthropicProvider
        provider = AnthropicProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
        )
        manager.register("anthropic", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_anthropic_registered")
    except ImportError:
        logger.warning("provider_factory_anthropic_import_failed")
    except Exception:
        logger.exception("provider_factory_anthropic_error")


def _register_google(
    manager: AIProviderManager,
    cb: CircuitBreaker,
    settings,
) -> None:
    """Register a Google provider if the API key is available."""
    if not settings.LLM_API_KEY:
        logger.warning("provider_factory_google_no_key")
        return
    try:
        from app.integrations.llm.google_provider import GoogleProvider
        provider = GoogleProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
        )
        manager.register("google", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_google_registered")
    except ImportError:
        logger.warning("provider_factory_google_import_failed")
    except Exception:
        logger.exception("provider_factory_google_error")