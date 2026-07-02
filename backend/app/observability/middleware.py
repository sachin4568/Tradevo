"""Observability ASGI middleware.

Production middleware that records request metrics (latency histograms,
error counters, endpoint gauges) when observability is enabled.
"""

from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.observability.metrics import get_metrics


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """ASGI middleware for request-level metrics.

    When METRICS_ENABLED is true, this middleware:
    - Records request duration histograms per endpoint
    - Counts requests by status code and endpoint
    - Tracks active request gauge
    - Adds request timing to response headers (X-Response-Time)
    """

    def __init__(self, app: object) -> None:
        super().__init__(app)
        self._metrics = get_metrics()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not self._metrics.enabled:
            return await call_next(request)

        path = request.url.path
        method = request.method

        # Skip metrics for health and metrics endpoints
        if path in ("/health", "/metrics", "/ready", "/live"):
            return await call_next(request)

        start_time = time.perf_counter()
        self._metrics.gauge("requests_active", 1.0, {"method": method, "path": path})

        try:
            response = await call_next(request)
        finally:
            duration_ms = (time.perf_counter() - start_time) * 1000
            self._metrics.gauge("requests_active", 0.0, {"method": method, "path": path})

            self._metrics.histogram(
                "request_duration_ms",
                duration_ms,
                {"method": method, "path": path, "status": str(response.status_code)},
            )
            self._metrics.increment(
                "requests_total",
                {"method": method, "path": path, "status": str(response.status_code)},
            )

            if response.status_code >= 500:
                self._metrics.increment(
                    "errors_total",
                    {"method": method, "path": path, "status": str(response.status_code)},
                )

            response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        return response