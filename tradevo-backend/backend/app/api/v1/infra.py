"""Infrastructure API endpoints.

GET /status  → deep health: app version, database, AI provider, market provider
GET /version → application version with build metadata
GET /metrics → application metrics snapshot (when enabled)

These are public endpoints (no authentication required).
"""

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["Infrastructure"])


@router.get(
    "/status",
    summary="Application status",
    description=(
        "Deep health check exposing application configuration status. "
        "Returns version, masked database URL, active provider names, "
        "rate limiting state, and cache/telemetry statistics."
    ),
    responses={
        200: {
            "description": "Application status",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Application status retrieved successfully",
                        "data": {
                            "app": "Tradevo",
                            "version": "1.0.0",
                            "environment": "production",
                        },
                    }
                }
            },
        }
    },
)
async def get_status() -> dict:
    """Deep health check exposing application configuration status."""
    settings = get_settings()

    db_url = settings.DATABASE_URL or ""
    masked_db = _mask_db_url(db_url)

    cache_stats = {}
    try:
        from app.modules.ai.cache.cache_layer import get_ai_cache
        cache_stats = get_ai_cache().stats()
    except Exception:
        pass

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
    summary="Application version and build metadata",
    description=(
        "Return the application name, version, build timestamp, "
        "git commit hash (if available), environment, and API version."
    ),
    responses={
        200: {
            "description": "Version information",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Version retrieved successfully",
                        "data": {
                            "name": "Tradevo",
                            "version": "1.0.0",
                            "apiVersion": "v1",
                            "environment": "production",
                            "buildTimestamp": "2026-07-02T00:00:00Z",
                            "gitCommit": "abc1234",
                        },
                    }
                }
            },
        }
    },
)
async def get_version() -> dict:
    """Return the application version and build metadata."""
    import subprocess
    from datetime import UTC, datetime

    settings = get_settings()

    # Attempt to get git commit hash
    git_commit = "unknown"
    import contextlib
    with contextlib.suppress(subprocess.CalledProcessError, FileNotFoundError):
        git_commit = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()[:12]

    # Build timestamp from environment or fallback to now
    build_ts = "unknown"
    try:
        from importlib.resources import files as _files
        build_info_path = _files("app") / "_build_info.py"
        if build_info_path.is_file():
            ns = {}
            exec(build_info_path.read_text(), ns)  # noqa: S102
            build_ts = ns.get("BUILD_TIMESTAMP", "unknown")
    except Exception:
        build_ts = datetime.now(UTC).isoformat()

    return {
        "success": True,
        "message": "Version retrieved successfully",
        "data": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "apiVersion": "v1",
            "environment": "development" if settings.DEBUG else "production",
            "buildTimestamp": build_ts,
            "gitCommit": git_commit,
        },
    }


@router.get(
    "/metrics",
    summary="Application metrics",
    description=(
        "Return a snapshot of collected application metrics when "
        "observability is enabled. Includes counters, histograms, and gauges."
    ),
    responses={
        200: {"description": "Metrics snapshot"},
    },
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
    """Mask the password in a database URL for safe display."""
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
