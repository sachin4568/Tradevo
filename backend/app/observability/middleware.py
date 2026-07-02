"""Observability ASGI middleware scaffolding.

Reserved for Prometheus metrics and OpenTelemetry tracing middleware.
When observability is enabled, this middleware will wrap requests
with tracing spans and record request metrics.
"""


class ObservabilityMiddleware:
    """Placeholder for observability middleware.

    When METRICS_ENABLED or TRACING_ENABLED is true, this middleware
    will be added to the FastAPI middleware stack to:
    - Create tracing spans for each request
    - Record request duration histograms
    - Count requests by status code and endpoint
    """

    def __init__(self, app: object) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: object, send: object) -> None:
        await self.app(scope, receive, send)
