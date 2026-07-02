"""Infrastructure API endpoints.

GET /status  → deep health: app version, database, AI provider, market provider
GET /version → application version only
GET /metrics → application metrics snapshot (when enabled)

These are public endpoints (no authentication required).
"""

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["Infrastructure"])


@router.get(
    "/status",
    summary="Application status",
    description="Returns version, database connectivity, and active provider info.",
)
async def get_status() -> dict:
    """Deep health check exposing application configuration status.

    Returns version, database URL (masked), and active provider names
    for AI, market data, and news services.
    """
    settings = get_settings()

    # Mask database password for safety
    db_url = settings.DATABASE_URL or ""
    masked_db = _mask_db_url(db_url)

    # Gather AI cache stats
    cache_stats = {}
    try:
        from app.modules.ai.cache.cache_layer import get_ai_cache
        cache_stats = get_ai_cache().stats()
    except Exception:
        pass

    # Gather AI telemetry stats
    ai_stats = {}
    try:
        from app.modules.ai.telemetry import get_ai_telemetry
        ai_stats = get_ai_telemetry().get_global_stats()
    except Exception:
        pass

    return {
        "success": True,
        "message": "Application status retrieved successfully",
        "data": {
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": "development" if settings.DEBUG else "production",
            "database": {
                "connected": bool(db_url),
                "url": masked_db,
            },
            "providers": {
                "ai": settings.AI_PROVIDER,
                "llm": settings.LLM_PROVIDER,
                "market": settings.MARKET_PROVIDER,
                "news": settings.NEWS_PROVIDER,
            },
            "rateLimiting": {
                "enabled": settings.RATE_LIMIT_ENABLED,
                "defaultLimit": settings.RATE_LIMIT_DEFAULT,
            },
            "observability": {
                "metrics": settings.METRICS_ENABLED,
                "tracing": settings.TRACING_ENABLED,
            },
            "cache": cache_stats,
            "ai": ai_stats,
        },
    }


@router.get(
    "/version",
    summary="Application version",
    description="Returns the application name and version.",
)
async def get_version() -> dict:
    """Return the application version string."""
    settings = get_settings()
    return {
        "success": True,
        "message": "Version retrieved successfully",
        "data": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
        },
    }


@router.get(
    "/metrics",
    summary="Application metrics",
    description="Returns a snapshot of collected metrics when observability is enabled.",
)
async def get_metrics() -> dict:
    """Return the current metrics snapshot."""
    from app.observability.metrics import get_metrics
    metrics = get_metrics()
    return {
        "success": True,
        "message": "Metrics retrieved successfully",
        "data": metrics.snapshot(),
    }


def _mask_db_url(url: str) -> str:
    """Mask the password in a database URL for safe display.

    postgresql+asyncpg://user:password@host:5432/db
    → postgresql+asyncpg://user:****@host:5432/db
    """
    if "://" not in url:
        return url
    prefix, rest = url.split("://", 1)
    if ":" not in rest:
        return url
    user_pass, host_part = rest.split("@", 1)
    if ":" in user_pass:
        user, _ = user_pass.split(":", 1)
        return f"{prefix}://{user}:****@{host_part}"
    return url