"""Security headers middleware.

Adds production security headers to all responses.
Configurable via SECURITY_HEADERS_ENABLED setting.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that adds security headers to responses.

    Headers added:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 0 (modern browsers handle XSS)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Content-Security-Policy: restrictive defaults
    - Permissions-Policy: restrict browser features
    """

    # Headers that are always added regardless of configuration
    _HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "0",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    }

    def __init__(self, app: object, enabled: bool = True) -> None:
        super().__init__(app)
        self._enabled = enabled

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        if not self._enabled:
            return response

        # Don't add security headers to health/metrics
        if request.url.path in ("/health", "/metrics", "/ready", "/live"):
            return response

        for header, value in self._HEADERS.items():
            if header not in response.headers:
                response.headers[header] = value

        # Add CSP header (restrictive for API)
        if "Content-Security-Policy" not in response.headers:
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; "
                "frame-ancestors 'none'; "
                "form-action 'self'"
            )

        return response