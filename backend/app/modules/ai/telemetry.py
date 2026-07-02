"""AI Telemetry (BA-016).

Collects and exports telemetry data for every AI request/response cycle.
Provides visibility into:
- Request latency and token usage
- Error rates and retry counts
- Cache hit/miss rates
- Provider-level performance
- Circuit breaker events

Telemetry data feeds into the observability pipeline (logs, metrics,
future Prometheus integration).
"""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

from app.modules.ai.schemas import (
    AIRequestStatus,
    AIRequestType,
    AITelemetryEvent,
)

logger = logging.getLogger(__name__)


@dataclass
class ProviderStats:
    """Aggregated statistics for a single provider."""

    total_requests: int = 0
    successful: int = 0
    failed: int = 0
    total_tokens: int = 0
    total_duration_ms: int = 0
    errors: dict[str, int] = field(default_factory=lambda: defaultdict(int))

    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return (self.successful / self.total_requests) * 100

    @property
    def avg_duration_ms(self) -> float:
        if self.successful == 0:
            return 0.0
        return self.total_duration_ms / self.successful


@dataclass
class PromptKeyStats:
    """Aggregated statistics for a single prompt key."""

    total_requests: int = 0
    total_tokens: int = 0
    total_duration_ms: int = 0
    cache_hits: int = 0
    cache_misses: int = 0

    @property
    def avg_duration_ms(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.total_duration_ms / self.total_requests

    @property
    def cache_hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return (self.cache_hits / total) * 100


class AITelemetry:
    """Centralized AI telemetry collector.

    Thread-safe. Records events and provides aggregated statistics.

    Usage:
        telemetry = AITelemetry()
        telemetry.record_event(telemetry_event)
        stats = telemetry.get_provider_stats("openai")
    """

    def __init__(self, max_history: int = 1000) -> None:
        self._lock = threading.Lock()
        self._events: list[AITelemetryEvent] = []
        self._max_history = max_history
        self._provider_stats: dict[str, ProviderStats] = defaultdict(ProviderStats)
        self._prompt_stats: dict[str, PromptKeyStats] = defaultdict(PromptKeyStats)
        self._total_requests = 0
        self._total_errors = 0
        self._total_cached = 0

    def record_event(self, event: AITelemetryEvent) -> None:
        """Record a telemetry event and update aggregates."""
        with self._lock:
            self._events.append(event)
            if len(self._events) > self._max_history:
                self._events = self._events[-self._max_history:]

            self._total_requests += 1

            # Provider stats
            pstats = self._provider_stats[event.provider]
            pstats.total_requests += 1
            pstats.total_tokens += event.total_tokens
            pstats.total_duration_ms += event.duration_ms
            if event.status == AIRequestStatus.COMPLETED:
                pstats.successful += 1
            elif event.status == AIRequestStatus.FAILED:
                pstats.failed += 1
                self._total_errors += 1
                if event.error:
                    pstats.errors[event.error] += 1

            # Prompt stats
            kstats = self._prompt_stats[event.prompt_key]
            kstats.total_requests += 1
            kstats.total_tokens += event.total_tokens
            kstats.total_duration_ms += event.duration_ms
            if event.cached:
                kstats.cache_hits += 1
                self._total_cached += 1
            else:
                kstats.cache_misses += 1

    def get_provider_stats(self, provider: str) -> dict[str, Any]:
        """Get aggregated statistics for a specific provider."""
        with self._lock:
            stats = self._provider_stats.get(provider)
            if stats is None:
                return {"provider": provider, "totalRequests": 0}
            return {
                "provider": provider,
                "totalRequests": stats.total_requests,
                "successful": stats.successful,
                "failed": stats.failed,
                "successRate": round(stats.success_rate, 2),
                "totalTokens": stats.total_tokens,
                "avgDurationMs": round(stats.avg_duration_ms, 2),
                "topErrors": dict(sorted(
                    stats.errors.items(),
                    key=lambda x: x[1],
                    reverse=True,
                )[:5]),
            }

    def get_prompt_stats(self, prompt_key: str) -> dict[str, Any]:
        """Get aggregated statistics for a specific prompt key."""
        with self._lock:
            stats = self._prompt_stats.get(prompt_key)
            if stats is None:
                return {"promptKey": prompt_key, "totalRequests": 0}
            return {
                "promptKey": prompt_key,
                "totalRequests": stats.total_requests,
                "totalTokens": stats.total_tokens,
                "avgDurationMs": round(stats.avg_duration_ms, 2),
                "cacheHits": stats.cache_hits,
                "cacheMisses": stats.cache_misses,
                "cacheHitRate": round(stats.cache_hit_rate, 2),
            }

    def get_global_stats(self) -> dict[str, Any]:
        """Get global AI platform statistics."""
        with self._lock:
            return {
                "totalRequests": self._total_requests,
                "totalErrors": self._total_errors,
                "totalCached": self._total_cached,
                "cacheRate": round(
                    (self._total_cached / self._total_requests * 100)
                    if self._total_requests > 0 else 0.0,
                    2,
                ),
                "activeProviders": len(self._provider_stats),
                "activePrompts": len(self._prompt_stats),
            }

    def get_recent_events(
        self, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Get the most recent telemetry events."""
        with self._lock:
            events = self._events[-limit:]
            return [
                {
                    "correlationId": e.correlation_id,
                    "promptKey": e.prompt_key,
                    "provider": e.provider,
                    "model": e.model,
                    "status": e.status.value,
                    "durationMs": e.duration_ms,
                    "totalTokens": e.total_tokens,
                    "cached": e.cached,
                    "error": e.error,
                    "retryCount": e.retry_count,
                }
                for e in events
            ]

    def reset(self) -> None:
        """Reset all telemetry data (used in tests)."""
        with self._lock:
            self._events.clear()
            self._provider_stats.clear()
            self._prompt_stats.clear()
            self._total_requests = 0
            self._total_errors = 0
            self._total_cached = 0


# Module-level singleton
_default_telemetry: AITelemetry | None = None


def get_ai_telemetry() -> AITelemetry:
    """Get the default AI telemetry instance."""
    global _default_telemetry
    if _default_telemetry is None:
        _default_telemetry = AITelemetry()
    return _default_telemetry


def reset_ai_telemetry() -> None:
    """Reset the default telemetry (used in tests)."""
    global _default_telemetry
    if _default_telemetry:
        _default_telemetry.reset()
    _default_telemetry = None