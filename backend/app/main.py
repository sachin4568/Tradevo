"""FastAPI application factory and startup configuration.

Creates the FastAPI app instance, registers middleware, mounts the API router,
and configures global exception handlers. Uses a lifespan context manager
for startup/shutdown events (database engine initialization).
"""

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

    # Initialize database engine (creates connection pool)
    engine = get_engine()

    # Warm up AI cache with configured TTL
    try:
        from app.config import get_settings as _gs
        from app.modules.ai.cache.cache_layer import get_ai_cache, reset_ai_cache
        reset_ai_cache()
        cache = get_ai_cache()
        _s = _gs()
        if hasattr(cache._backend, '_max_size'):
            cache._backend._max_size = _s.AI_CACHE_MAX_SIZE
        if hasattr(cache, '_default_ttl'):
            cache._default_ttl = float(_s.AI_CACHE_TTL)
    except Exception:
        pass

    yield

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
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

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
        """Handle all Tradevo domain/infrastructure exceptions.

        Returns the standardized error envelope matching the frontend's
        ApiError type contract.
        """
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
        import logging
        logger = logging.getLogger("app.main")
        logger.critical(
            "Unhandled exception path=%s method=%s",
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

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict:
        """Liveness probe for container orchestration.

        Only checks that the process is responsive.
        """
        return {"status": "healthy", "version": settings.APP_VERSION}

    @app.get("/ready", tags=["Health"])
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

    @app.get("/live", tags=["Health"])
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

    return app


# Module-level app instance for Uvicorn: uvicorn app.main:app
app = create_app()