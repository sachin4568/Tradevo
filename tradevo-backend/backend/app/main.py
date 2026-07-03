"""FastAPI application factory and startup configuration.

Creates the FastAPI app instance, registers middleware, mounts the API router,
and configures global exception handlers. Uses a lifespan context manager
for startup/shutdown events (database engine initialization).
"""

import logging
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.middleware.logging import LoggingMiddleware
from app.api.middleware.rate_limit import RateLimitMiddleware
from app.api.middleware.request_id import RequestIDMiddleware
from app.api.middleware.security import SecurityHeadersMiddleware
from app.api.router import api_router
from app.config import get_settings
from app.core.database import get_engine
from app.core.exceptions import TradevoBaseError
from app.observability.logging import setup_logging
from app.observability.middleware import ObservabilityMiddleware

logger = logging.getLogger(__name__)

# Track process start time for uptime calculation
_PROCESS_START = time.monotonic()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events.

    Startup:
    1. Configure structured logging
    2. Initialize the database engine (connection pool)
    3. Warm up provider clients and cache

    Shutdown:
    1. Dispose of the database engine (close all connections)
    2. Close provider httpx clients
    """
    settings = get_settings()
    setup_logging(log_level=settings.LOG_LEVEL)

    logger.info(
        "application_starting app=%s version=%s env=%s",
        settings.APP_NAME,
        settings.APP_VERSION,
        "development" if settings.DEBUG else "production",
    )

    # Initialize database engine (creates connection pool)
    engine = get_engine()

    # Warm up AI cache with configured TTL
    try:
        from app.modules.ai.cache.cache_layer import get_ai_cache, reset_ai_cache
        reset_ai_cache()
        cache = get_ai_cache()
        if hasattr(cache._backend, '_max_size'):
            cache._backend._max_size = settings.AI_CACHE_MAX_SIZE
        if hasattr(cache, '_default_ttl'):
            cache._default_ttl = float(settings.AI_CACHE_TTL)
    except Exception:
        pass

    # Record application info metrics
    try:
        from app.observability.metrics import get_metrics
        m = get_metrics()
        m.gauge("app_info", 1.0, {"version": settings.APP_VERSION})
        m.gauge("app_uptime_seconds", 0.0)
    except Exception:
        pass

    logger.info("application_started app=%s", settings.APP_NAME)

    yield

    # Shutdown
    logger.info("application_stopping app=%s", settings.APP_NAME)

    # Dispose engine (close all pooled connections)
    await engine.dispose()

    # Close provider clients
    try:
        from app.integrations.market.factory import create_market_provider
        mp = create_market_provider()
        if mp and hasattr(mp, "close"):
            await mp.close()
    except Exception:
        pass
    try:
        from app.integrations.news.factory import create_news_provider
        np = create_news_provider()
        if np and hasattr(np, "close"):
            await np.close()
    except Exception:
        pass

    logger.info("application_stopped app=%s", settings.APP_NAME)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    This factory pattern allows creating test instances of the app
    with overridden dependencies. The app is also available as
    `app` module-level variable for Uvicorn to discover.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Tradevo — AI-powered virtual investment learning platform. "
            "Provides virtual trading, AI-powered research, portfolio analytics, "
            "and educational feedback for learning investors."
        ),
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
        contact={"name": "Tradevo API", "url": "https://tradevo.dev"},
        license_info={"name": "Proprietary"},
    )

    # ─── OpenAPI version metadata ───
    app.openapi_tags = [
        {"name": "Authentication", "description": "User registration, login, token management"},
        {"name": "Users", "description": "User profile management"},
        {"name": "Companies", "description": "Company listing and details (public)"},
        {"name": "Market", "description": "Market overview, sectors, and news (public)"},
        {"name": "Portfolio", "description": "Portfolio summary and holdings (authenticated)"},
        {"name": "Transactions", "description": "Buy and sell order execution (authenticated)"},
        {"name": "Watchlist", "description": "Watchlist management (authenticated)"},
        {"name": "Learning", "description": "Learning sessions and progress (authenticated)"},
        {"name": "Research", "description": "AI-powered research reports (authenticated)"},
        {"name": "AI Intelligence", "description": "AI portfolio analysis and feedback (authenticated)"},
        {"name": "Infrastructure", "description": "Health checks, version, and metrics (public)"},
        {"name": "Health", "description": "Container orchestration probes"},
    ]

    # ─── Middleware (order matters: last registered = first executed) ───

    # Security headers (added closest to response)
    app.add_middleware(
        SecurityHeadersMiddleware,
        enabled=settings.SECURITY_HEADERS_ENABLED,
    )

    # CORS: allow frontend origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting
    app.add_middleware(
        RateLimitMiddleware,
        enabled=settings.RATE_LIMIT_ENABLED,
    )

    # Request ID injection
    app.add_middleware(RequestIDMiddleware)

    # Request/response logging
    app.add_middleware(LoggingMiddleware)

    # Observability (metrics + timing)
    app.add_middleware(ObservabilityMiddleware)

    # ─── Request Size Limit ───
    max_size = settings.REQUEST_MAX_SIZE_MB * 1024 * 1024

    @app.middleware("http")
    async def request_size_limit(request: Request, call_next):
        """Reject requests exceeding the configured size limit."""
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > max_size:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "message": "Request body too large",
                    "errorCode": "PAYLOAD_TOO_LARGE",
                },
            )
        return await call_next(request)

    # ─── Exception Handlers ───

    @app.exception_handler(TradevoBaseError)
    async def tradevo_error_handler(request: Request, exc: TradevoBaseError) -> JSONResponse:
        """Handle all Tradevo domain/infrastructure exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "errorCode": exc.error_code,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all for unexpected exceptions.

        Logs the full exception details but returns a generic message
        to the client to prevent information leakage.
        """
        logger.critical(
            "unhandled_exception path=%s method=%s",
            request.url.path,
            request.method,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "An internal error occurred",
                "errorCode": "INTERNAL_ERROR",
            },
        )

    # ─── Routers ───

    app.include_router(api_router, prefix="/api/v1")

    # ─── Health Check Endpoints ───

    @app.get("/health", tags=["Health"], summary="Liveness probe")
    async def health_check() -> dict:
        """Liveness probe for container orchestration.

        Only checks that the process is responsive.
        """
        uptime = time.monotonic() - _PROCESS_START
        return {"status": "healthy", "version": settings.APP_VERSION, "uptime_seconds": round(uptime, 1)}

    @app.get("/ready", tags=["Health"], summary="Readiness probe")
    async def readiness_check() -> dict:
        """Readiness probe — checks all critical dependencies."""
        from app.observability.health import get_health_service
        service = get_health_service()
        report = await service.check_readiness()
        status_code = 200 if report.status != "unhealthy" else 503
        return JSONResponse(
            status_code=status_code,
            content={
                "success": report.status != "unhealthy",
                "message": f"System {report.status}",
                "data": report.to_dict(),
            },
        )

    @app.get("/live", tags=["Health"], summary="Liveness probe (detailed)")
    async def liveness_check() -> dict:
        """Liveness probe — basic process health."""
        from app.observability.health import get_health_service
        service = get_health_service()
        report = await service.check_liveness()
        return {
            "success": True,
            "message": "Process is alive",
            "data": report.to_dict(),
        }

    # ─── Prometheus-style Metrics Endpoint ───

    @app.get("/metrics/prometheus", tags=["Infrastructure"], summary="Prometheus metrics")
    async def prometheus_metrics() -> dict:
        """Return metrics in a Prometheus-friendly format.

        Requires METRICS_ENABLED=true. Returns application info,
        request metrics, provider metrics, cache metrics, and uptime.
        """
        from app.observability.metrics import get_metrics
        metrics = get_metrics()

        # Compute uptime
        uptime_s = time.monotonic() - _PROCESS_START
        metrics.gauge("app_uptime_seconds", uptime_s)

        return {
            "success": True,
            "message": "Prometheus metrics",
            "data": metrics.snapshot(),
        }

    return app


# Module-level app instance for Uvicorn: uvicorn app.main:app
app = create_app()
