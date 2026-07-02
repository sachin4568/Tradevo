"""Health check service.

Provides deep health checks for all system components:
database, AI provider, market provider, news provider, cache.
Supports readiness (all dependencies healthy) and liveness
(basic process health) probes.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class ComponentHealth:
    """Health status of a single system component."""

    name: str
    healthy: bool
    latency_ms: float = 0.0
    error: str | None = None
    details: dict[str, Any] = field(default_factory=dict)


@dataclass
class HealthReport:
    """Aggregate health report for all components."""

    status: str  # "healthy", "degraded", "unhealthy"
    components: dict[str, ComponentHealth] = field(default_factory=dict)
    timestamp: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "timestamp": self.timestamp,
            "components": {
                name: {
                    "healthy": ch.healthy,
                    "latencyMs": round(ch.latency_ms, 2),
                    "error": ch.error,
                    "details": ch.details,
                }
                for name, ch in self.components.items()
            },
        }


class HealthCheckService:
    """Aggregates health checks for all system components.

    Usage:
        service = HealthCheckService()
        report = await service.check_readiness()
    """

    async def check_database(self) -> ComponentHealth:
        """Check database connectivity."""
        start = time.monotonic()
        try:
            from app.core.database import get_engine
            engine = get_engine()
            async with engine.connect() as conn:
                await conn.execute.__self__.text("SELECT 1")
            latency = (time.monotonic() - start) * 1000
            return ComponentHealth(name="database", healthy=True, latency_ms=latency)
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.warning("health_check_db_failed error=%s", str(exc))
            return ComponentHealth(
                name="database", healthy=False, latency_ms=latency,
                error=str(exc),
            )

    async def check_ai_provider(self) -> ComponentHealth:
        """Check AI provider health via circuit breaker state."""
        start = time.monotonic()
        try:
            from app.modules.ai.provider_factory import create_provider_manager
            manager = create_provider_manager()
            # Use sync health status (circuit breaker state, no network calls)
            health_list = manager.get_health_status()
            latency = (time.monotonic() - start) * 1000

            provider_details = {}
            all_healthy = True
            for h in health_list:
                provider_details[h.name] = {
                    "healthy": h.is_healthy,
                    "circuitState": h.circuit_state,
                    "priority": h.priority,
                }
                if not h.is_healthy:
                    all_healthy = False

            return ComponentHealth(
                name="ai_provider",
                healthy=all_healthy,
                latency_ms=latency,
                details={
                    "providers": provider_details,
                    "totalCount": len(health_list),
                },
            )
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.warning("health_check_ai_failed error=%s", str(exc))
            return ComponentHealth(
                name="ai_provider", healthy=False, latency_ms=latency,
                error=str(exc),
            )

    async def check_market_provider(self) -> ComponentHealth:
        """Check market data provider health."""
        start = time.monotonic()
        try:
            from app.integrations.market.factory import create_market_provider
            provider = create_market_provider()
            if provider is None:
                latency = (time.monotonic() - start) * 1000
                return ComponentHealth(
                    name="market_provider", healthy=True, latency_ms=latency,
                    details={"reason": "no_provider_configured"},
                )
            healthy = await provider.health_check()
            latency = (time.monotonic() - start) * 1000
            return ComponentHealth(
                name="market_provider", healthy=healthy, latency_ms=latency,
                details={"provider": provider.get_provider_name()},
            )
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.warning("health_check_market_failed error=%s", str(exc))
            return ComponentHealth(
                name="market_provider", healthy=False, latency_ms=latency,
                error=str(exc),
            )

    async def check_news_provider(self) -> ComponentHealth:
        """Check news provider health."""
        start = time.monotonic()
        try:
            from app.integrations.news.factory import create_news_provider
            provider = create_news_provider()
            if provider is None:
                latency = (time.monotonic() - start) * 1000
                return ComponentHealth(
                    name="news_provider", healthy=True, latency_ms=latency,
                    details={"reason": "no_provider_configured"},
                )
            healthy = await provider.health_check()
            latency = (time.monotonic() - start) * 1000
            return ComponentHealth(
                name="news_provider", healthy=healthy, latency_ms=latency,
                details={"provider": provider.get_provider_name()},
            )
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.warning("health_check_news_failed error=%s", str(exc))
            return ComponentHealth(
                name="news_provider", healthy=False, latency_ms=latency,
                error=str(exc),
            )

    async def check_cache(self) -> ComponentHealth:
        """Check AI cache health."""
        start = time.monotonic()
        try:
            from app.modules.ai.cache.cache_layer import get_ai_cache
            cache = get_ai_cache()
            stats = cache.stats()
            latency = (time.monotonic() - start) * 1000
            return ComponentHealth(
                name="cache", healthy=True, latency_ms=latency,
                details=stats,
            )
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.warning("health_check_cache_failed error=%s", str(exc))
            return ComponentHealth(
                name="cache", healthy=False, latency_ms=latency,
                error=str(exc),
            )

    async def check_readiness(self) -> HealthReport:
        """Full readiness check — all critical components must be healthy.

        Readiness means the application can serve real traffic.
        Database must be healthy. Other components can be degraded.
        """
        from datetime import UTC, datetime

        components = {
            "database": await self.check_database(),
            "ai_provider": await self.check_ai_provider(),
            "market_provider": await self.check_market_provider(),
            "news_provider": await self.check_news_provider(),
            "cache": await self.check_cache(),
        }

        # Determine overall status
        critical = ["database"]
        all_critical_healthy = all(components[k].healthy for k in critical)
        all_healthy = all(c.healthy for c in components.values())

        if all_healthy:
            status = "healthy"
        elif all_critical_healthy:
            status = "degraded"
        else:
            status = "unhealthy"

        return HealthReport(
            status=status,
            components=components,
            timestamp=datetime.now(UTC).isoformat(),
        )

    async def check_liveness(self) -> HealthReport:
        """Basic liveness check — is the process responding?

        Liveness means the process is running and not deadlocked.
        """
        from datetime import UTC, datetime

        return HealthReport(
            status="healthy",
            timestamp=datetime.now(UTC).isoformat(),
        )


# Module-level singleton
_health_service: HealthCheckService | None = None


def get_health_service() -> HealthCheckService:
    """Get the module-level health check service."""
    global _health_service
    if _health_service is None:
        _health_service = HealthCheckService()
    return _health_service