"""Rate limiting middleware.

In-process sliding window rate limiter.
Configurable per-endpoint limits via settings.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


def _parse_rate_limit(limit_str: str) -> tuple[int, int]:
    """Parse a rate limit string like '100/hour' into (count, window_seconds)."""
    try:
        count_str, period = limit_str.split("/")
        count = int(count_str)
        multipliers = {"second": 1, "minute": 60, "hour": 3600, "day": 86400}
        window = multipliers.get(period.lower(), 3600)
        return count, window
    except (ValueError, KeyError):
        return 100, 3600


@dataclass
class _Bucket:
    """A rate limit bucket for a single key."""

    count: int = 0
    limit: int = 100
    window_start: float = field(default_factory=time.time)
    window_size: int = 3600

    def is_limited(self) -> bool:
        """Check if this bucket has exceeded its limit."""
        now = time.time()
        if now - self.window_start >= self.window_size:
            self.count = 0
            self.window_start = now
            return False
        return self.count >= self.limit


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-process rate limiting middleware.

    Uses a sliding window counter per client IP and endpoint category.
    Categories are determined by URL path prefix.
    """

    def __init__(self, app: object, enabled: bool = True) -> None:
        super().__init__(app)
        self._enabled = enabled
        self._lock = threading.Lock()
        self._buckets: dict[str, _Bucket] = {}

        from app.config import get_settings
        settings = get_settings()

        self._default_limit, self._default_window = _parse_rate_limit(settings.RATE_LIMIT_DEFAULT)
        self._limits: dict[str, tuple[int, int]] = {
            "/api/v1/auth": _parse_rate_limit(settings.RATE_LIMIT_AUTH),
            "/api/v1/intelligence": _parse_rate_limit(settings.RATE_LIMIT_AI),
            "/api/v1/research": _parse_rate_limit(settings.RATE_LIMIT_AI),
            "/api/v1/market": _parse_rate_limit(settings.RATE_LIMIT_MARKET),
            "/api/v1/portfolio": _parse_rate_limit(settings.RATE_LIMIT_TRADE),
            "/api/v1/transactions": _parse_rate_limit(settings.RATE_LIMIT_TRADE),
        }

    def _get_limit(self, path: str) -> tuple[int, int]:
        """Get the rate limit (count, window) for a path."""
        for prefix, limit in self._limits.items():
            if path.startswith(prefix):
                return limit
        return self._default_limit, self._default_window

    def _get_bucket(self, key: str, limit: int, window: int) -> _Bucket:
        """Get or create a rate limit bucket."""
        with self._lock:
            if key not in self._buckets:
                self._buckets[key] = _Bucket(limit=limit, window_size=window)
            bucket = self._buckets[key]
            if bucket.window_size != window:
                bucket.window_size = window
            bucket.limit = limit
            return bucket

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not self._enabled:
            return await call_next(request)

        # Skip rate limiting for health/metrics
        skip_paths = (
            "/health", "/metrics", "/ready", "/live",
            "/api/v1/infra/status", "/api/v1/infra/version",
            "/metrics/prometheus",
        )
        if request.url.path in skip_paths:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        limit, window = self._get_limit(path)
        key = f"{client_ip}:{path.split('/')[3] if len(path.split('/')) > 3 else 'default'}"

        bucket = self._get_bucket(key, limit, window)

        if bucket.is_limited():
            logger.warning(
                "rate_limit_exceeded ip=%s path=%s key=%s",
                client_ip, path, key,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "message": "Rate limit exceeded. Please try again later.",
                    "errorCode": "RATE_LIMIT_EXCEEDED",
                },
            )

        # Increment counter
        with self._lock:
            bucket.count += 1

        response = await call_next(request)

        # Add rate limit headers
        remaining = max(0, limit - bucket.count)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(bucket.window_start + bucket.window_size))

        return response
