"""Request/response logging middleware.

Logs the HTTP method, path, status code, and duration for every request.
Uses the X-Request-ID injected by RequestIDMiddleware for correlation.
"""

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.observability.logging import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that logs request/response metadata.

    Logs at INFO level for successful requests and WARNING level
    for server errors (5xx). Request duration is included in every log entry.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        # Skip logging for health check and metrics endpoints
        if request.url.path in ("/health", "/metrics"):
            return await call_next(request)

        request_id = getattr(request.state, "request_id", "-")

        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            request_id=request_id,
        )

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000
        log_level = "warning" if response.status_code >= 500 else "info"

        logger.log(
            log_level,
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            request_id=request_id,
        )

        return response
