"""AI Provider Manager (BA-009a).

Manages multiple LLM provider instances, tracks health, and provides
automatic failover. Business modules never interact with providers
directly — all communication flows through the AI Request Manager,
which delegates to the Provider Manager.

The Provider Manager:
- Maintains a registry of named provider instances
- Tracks per-provider circuit breaker state
- Selects the primary provider based on configuration
- Falls back to alternate providers on failure
- Reports provider health and status
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from app.core.exceptions import LLMServiceUnavailableError
from app.integrations.base import CircuitBreaker
from app.integrations.llm.base import LLMProvider

logger = logging.getLogger(__name__)


@dataclass
class ProviderEntry:
    """A registered provider with its circuit breaker and metadata."""

    name: str
    provider: LLMProvider
    priority: int = 0  # Lower = higher priority
    circuit_breaker: CircuitBreaker = field(default_factory=CircuitBreaker)
    is_enabled: bool = True
    created_at: float = field(default_factory=time.monotonic)


class ProviderHealth:
    """Health snapshot for a single provider."""

    def __init__(self, entry: ProviderEntry, is_healthy: bool) -> None:
        self.name = entry.name
        self.provider_type = entry.provider.get_provider_name()
        self.is_enabled = entry.is_enabled
        self.is_healthy = is_healthy
        self.circuit_state = entry.circuit_breaker._state
        self.failure_count = entry.circuit_breaker._failure_count
        self.priority = entry.priority


class AIProviderManager:
    """Manages LLM provider lifecycle, health, and failover.

    Usage:
        manager = AIProviderManager()
        manager.register("mock", mock_provider, priority=10)
        manager.register("openai", openai_provider, priority=1)

        provider = manager.get_primary()
        provider = manager.get_provider("openai")
        alt = manager.get_failover_provider("openai")
    """

    def __init__(self) -> None:
        self._providers: dict[str, ProviderEntry] = {}

    def register(
        self,
        name: str,
        provider: LLMProvider,
        *,
        priority: int = 0,
        circuit_breaker: CircuitBreaker | None = None,
    ) -> None:
        """Register a provider instance.

        Args:
            name: Unique identifier for this provider.
            provider: The LLMProvider implementation.
            priority: Lower values = higher priority (used for failover).
            circuit_breaker: Optional pre-configured circuit breaker.
        """
        cb = circuit_breaker or CircuitBreaker()
        self._providers[name] = ProviderEntry(
            name=name,
            provider=provider,
            priority=priority,
            circuit_breaker=cb,
        )
        logger.info("ai_provider_registered name=%s priority=%d", name, priority)

    def unregister(self, name: str) -> None:
        """Remove a provider from the registry."""
        self._providers.pop(name, None)
        logger.info("ai_provider_unregistered name=%s", name)

    def get_provider(self, name: str) -> LLMProvider:
        """Get a specific provider by name.

        Raises:
            LLMServiceUnavailableError: If provider not found or disabled.
        """
        entry = self._providers.get(name)
        if entry is None:
            raise LLMServiceUnavailableError(
                message=f"AI provider '{name}' not registered"
            )
        if not entry.is_enabled:
            raise LLMServiceUnavailableError(
                message=f"AI provider '{name}' is disabled"
            )
        return entry.provider

    def get_primary(self) -> LLMProvider:
        """Get the highest-priority available provider.

        Selects the enabled provider with the lowest priority value
        whose circuit breaker is not open.

        Raises:
            LLMServiceUnavailableError: If no provider is available.
        """
        available = [
            e for e in self._providers.values()
            if e.is_enabled and not e.circuit_breaker.is_open
        ]
        if not available:
            raise LLMServiceUnavailableError(
                message="No AI providers available (all circuits open or disabled)"
            )
        available.sort(key=lambda e: e.priority)
        return available[0].provider

    def get_primary_name(self) -> str | None:
        """Get the name of the current primary provider, or None."""
        available = [
            e for e in self._providers.values()
            if e.is_enabled and not e.circuit_breaker.is_open
        ]
        if not available:
            return None
        available.sort(key=lambda e: e.priority)
        return available[0].name

    def get_failover_provider(self, exclude_name: str) -> LLMProvider | None:
        """Get the next available provider excluding the named one.

        Used when the primary or current provider fails.

        Returns:
            The next-highest-priority provider, or None if none available.
        """
        available = [
            e for e in self._providers.values()
            if e.is_enabled
            and e.name != exclude_name
            and not e.circuit_breaker.is_open
        ]
        if not available:
            return None
        available.sort(key=lambda e: e.priority)
        logger.info(
            "ai_provider_failover from=%s to=%s",
            exclude_name,
            available[0].name,
        )
        return available[0].provider

    def record_success(self, name: str) -> None:
        """Record a successful call for a provider's circuit breaker."""
        entry = self._providers.get(name)
        if entry:
            entry.circuit_breaker.record_success()

    def record_failure(self, name: str) -> None:
        """Record a failed call for a provider's circuit breaker."""
        entry = self._providers.get(name)
        if entry:
            entry.circuit_breaker.record_failure()

    def is_circuit_open(self, name: str) -> bool:
        """Check if a provider's circuit breaker is open."""
        entry = self._providers.get(name)
        if entry is None:
            return False
        return entry.circuit_breaker.is_open

    def enable_provider(self, name: str) -> None:
        """Enable a registered provider."""
        entry = self._providers.get(name)
        if entry:
            entry.is_enabled = True

    def disable_provider(self, name: str) -> None:
        """Disable a registered provider (will be skipped for selection)."""
        entry = self._providers.get(name)
        if entry:
            entry.is_enabled = False

    async def health_check(self, name: str) -> bool:
        """Run health check on a specific provider."""
        entry = self._providers.get(name)
        if entry is None:
            return False
        try:
            healthy = await entry.provider.health_check()
            if healthy:
                entry.circuit_breaker.record_success()
            else:
                entry.circuit_breaker.record_failure()
            return healthy
        except Exception:
            entry.circuit_breaker.record_failure()
            return False

    async def health_check_all(self) -> dict[str, bool]:
        """Run health checks on all registered providers."""
        results = {}
        for name in self._providers:
            results[name] = await self.health_check(name)
        return results

    def get_health_status(self) -> list[ProviderHealth]:
        """Get health status for all registered providers (sync stub).

        For async health checks, use health_check_all() instead.
        This method returns the circuit breaker state without
        making actual health check calls.
        """
        results = []
        for entry in self._providers.values():
            healthy = not entry.circuit_breaker.is_open
            results.append(ProviderHealth(entry, healthy))
        return results

    def list_providers(self) -> list[dict[str, Any]]:
        """List all registered providers with status."""
        return [
            {
                "name": e.name,
                "providerType": e.provider.get_provider_name(),
                "priority": e.priority,
                "isEnabled": e.is_enabled,
                "circuitState": e.circuit_breaker._state,
                "failureCount": e.circuit_breaker._failure_count,
            }
            for e in self._providers.values()
        ]

    @property
    def provider_count(self) -> int:
        """Number of registered providers."""
        return len(self._providers)

    @property
    def available_count(self) -> int:
        """Number of enabled providers with closed circuits."""
        return sum(
            1 for e in self._providers.values()
            if e.is_enabled and not e.circuit_breaker.is_open
        )