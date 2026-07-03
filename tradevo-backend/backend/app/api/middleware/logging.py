"""Request/response logging middleware.

Logs the HTTP method, path, status code, and duration for every request.
Uses the X-Request-ID injected by RequestIDMiddleware for correlation.
Binds the request_id to structlog context for all downstream loggers.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

_SKIP_PATHS = frozenset({"/health", "/metrics", "/ready", "/live", "/metrics/prometheus"})


class LoggingMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that logs request/response metadata.

    Logs at INFO level for successful requests and WARNING level
    for server errors (5xx). Request duration is included in every log entry.
    Binds the request_id to structlog context for correlated logging.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        # Skip logging for health and metrics endpoints
        if request.url.path in _SKIP_PATHS:
            return await call_next(request)

        request_id = getattr(request.state, "request_id", "-")

        # Bind request_id to structlog context for downstream loggers
        try:
            import structlog
            structlog.contextvars.clear_contextvars()
            structlog.contextvars.bind_contextvars(request_id=request_id)
        except Exception:
            pass

        logger.info(
            "request_started method=%s path=%s request_id=%s",
            request.method,
            request.url.path,
            request_id,
        )

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000
        log_level = "warning" if response.status_code >= 500 else "info"

        logger.log(
            logging.WARNING if log_level == "warning" else logging.INFO,
            "request_completed method=%s path=%s status=%d duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )

        # Clear context vars to prevent leaking to next request
        try:
            import structlog
            structlog.contextvars.clear_contextvars()
        except Exception:
            pass

        return response
