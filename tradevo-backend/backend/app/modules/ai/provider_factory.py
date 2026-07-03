"""AI Provider Factory (BA-009b).

Creates and configures LLM provider instances based on application
settings. Replaces the simple factory in integrations/llm/factory.py
with a full provider factory that supports:
- Configuration-driven provider instantiation
- Automatic circuit breaker setup from config
- Provider manager population
- Per-provider API keys, models, and timeouts
- Runtime provider switching
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

    # ─── Live Provider Configuration ───
    llm_provider = settings.LLM_PROVIDER
    cb = CircuitBreaker(failure_threshold=threshold, recovery_timeout=recovery)

    _provider_registry = {
        "openai": _register_openai,
        "anthropic": _register_anthropic,
        "google": _register_gemini,
        "gemini": _register_gemini,
        "openrouter": _register_openrouter,
        "ollama": _register_ollama,
    }

    registrar = _provider_registry.get(llm_provider)
    if registrar:
        registrar(manager, cb, settings)

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
    api_key = settings.OPENAI_API_KEY or settings.LLM_API_KEY
    if not api_key:
        logger.warning("provider_factory_openai_no_key")
        return
    try:
        from app.integrations.llm.openai_provider import OpenAIProvider
        provider = OpenAIProvider(
            api_key=api_key,
            model=settings.OPENAI_MODEL,
            base_url=settings.OPENAI_BASE_URL,
            timeout=settings.OPENAI_TIMEOUT,
        )
        manager.register("openai", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_openai_registered model=%s", settings.OPENAI_MODEL)
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
    api_key = settings.ANTHROPIC_API_KEY or settings.LLM_API_KEY
    if not api_key:
        logger.warning("provider_factory_anthropic_no_key")
        return
    try:
        from app.integrations.llm.anthropic_provider import AnthropicProvider
        provider = AnthropicProvider(
            api_key=api_key,
            model=settings.ANTHROPIC_MODEL,
            base_url=settings.ANTHROPIC_BASE_URL,
            timeout=settings.ANTHROPIC_TIMEOUT,
        )
        manager.register("anthropic", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_anthropic_registered model=%s", settings.ANTHROPIC_MODEL)
    except ImportError:
        logger.warning("provider_factory_anthropic_import_failed")
    except Exception:
        logger.exception("provider_factory_anthropic_error")


def _register_gemini(
    manager: AIProviderManager,
    cb: CircuitBreaker,
    settings,
) -> None:
    """Register a Gemini provider if the API key is available."""
    api_key = settings.GEMINI_API_KEY or settings.LLM_API_KEY
    if not api_key:
        logger.warning("provider_factory_gemini_no_key")
        return
    try:
        from app.integrations.llm.gemini_provider import GeminiProvider
        provider = GeminiProvider(
            api_key=api_key,
            model=settings.GEMINI_MODEL,
            timeout=settings.GEMINI_TIMEOUT,
        )
        manager.register("gemini", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_gemini_registered model=%s", settings.GEMINI_MODEL)
    except ImportError:
        logger.warning("provider_factory_gemini_import_failed")
    except Exception:
        logger.exception("provider_factory_gemini_error")


def _register_openrouter(
    manager: AIProviderManager,
    cb: CircuitBreaker,
    settings,
) -> None:
    """Register an OpenRouter provider if the API key is available."""
    api_key = settings.OPENROUTER_API_KEY or settings.LLM_API_KEY
    if not api_key:
        logger.warning("provider_factory_openrouter_no_key")
        return
    try:
        from app.integrations.llm.openrouter_provider import OpenRouterProvider
        provider = OpenRouterProvider(
            api_key=api_key,
            model=settings.OPENROUTER_MODEL,
            base_url=settings.OPENROUTER_BASE_URL,
            timeout=settings.OPENROUTER_TIMEOUT,
        )
        manager.register("openrouter", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_openrouter_registered model=%s", settings.OPENROUTER_MODEL)
    except ImportError:
        logger.warning("provider_factory_openrouter_import_failed")
    except Exception:
        logger.exception("provider_factory_openrouter_error")


def _register_ollama(
    manager: AIProviderManager,
    cb: CircuitBreaker,
    settings,
) -> None:
    """Register an Ollama provider (no API key required)."""
    try:
        from app.integrations.llm.ollama_provider import OllamaProvider
        provider = OllamaProvider(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            timeout=settings.OLLAMA_TIMEOUT,
        )
        manager.register("ollama", provider, priority=1, circuit_breaker=cb)
        logger.info("provider_factory_ollama_registered model=%s", settings.OLLAMA_MODEL)
    except ImportError:
        logger.warning("provider_factory_ollama_import_failed")
    except Exception:
        logger.exception("provider_factory_ollama_error")
