"""Request/response logging middleware.

Logs the HTTP method, path, status code, and duration for every request.
Uses the X-Request-ID injected by RequestIDMiddleware for correlation.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that logs request/response metadata.

    Logs at INFO level for successful requests and WARNING level
    for server errors (5xx). Request duration is included in every log entry.
    """

    _SKIP_PATHS = frozenset({"/health", "/metrics", "/ready", "/live"})

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        # Skip logging for health and metrics endpoints
        if request.url.path in self._SKIP_PATHS:
            return await call_next(request)

        request_id = getattr(request.state, "request_id", "-")

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
            logging.WARN if log_level == "warning" else logging.INFO,
            "request_completed method=%s path=%s status=%d duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )

        return response