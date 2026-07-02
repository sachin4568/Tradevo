"""X-Request-ID middleware.

Injects a unique request identifier into every incoming request.
This ID flows through the entire request lifecycle and is included
in all log entries, enabling request tracing across services.
"""

import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that ensures every request has an X-Request-ID header.

    If the client provides an X-Request-ID, it is preserved.
    Otherwise, a new UUID4 is generated and set on both the request
    and the response.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
