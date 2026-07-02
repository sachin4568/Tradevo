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
from app.api.middleware.request_id import RequestIDMiddleware
from app.api.router import api_router
from app.config import get_settings
from app.core.database import get_engine
from app.core.exceptions import TradevoBaseError
from app.observability.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events.

    Startup:
    1. Configure structured logging
    2. Initialize the database engine (connection pool)

    Shutdown:
    1. Dispose of the database engine (close all connections)
    """
    settings = get_settings()
    setup_logging(log_level=settings.LOG_LEVEL)

    # Initialize database engine (creates connection pool)
    engine = get_engine()
    yield
    # Dispose engine (close all pooled connections)
    await engine.dispose()


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

    # CORS: allow frontend origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request ID injection
    app.add_middleware(RequestIDMiddleware)

    # Request/response logging
    app.add_middleware(LoggingMiddleware)

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
            "Unhandled exception",
            exc_info=exc,
            path=request.url.path,
            method=request.method,
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

    # ─── Health Check ───

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict:
        """Liveness probe for container orchestration."""
        return {"status": "healthy", "version": settings.APP_VERSION}

    return app


# Module-level app instance for Uvicorn: uvicorn app.main:app
app = create_app()
