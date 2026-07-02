"""Distributed tracing scaffolding.

Reserved for OpenTelemetry integration. When TRACING_ENABLED=true,
this module will initialize an OpenTelemetry tracer provider and
instrument FastAPI, SQLAlchemy, and HTTP clients.

Currently provides a no-op tracer so that span creation calls
can be added to code without conditional checks.
"""

from typing import Any


class NoOpSpan:
    """No-op span that does nothing when tracing is disabled."""

    def __enter__(self) -> "NoOpSpan":
        return self

    def __exit__(self, *args: Any) -> None:
        pass

    async def __aenter__(self) -> "NoOpSpan":
        return self

    async def __aexit__(self, *args: Any) -> None:
        pass

    def set_attribute(self, key: str, value: Any) -> None:
        pass

    def record_exception(self, exception: Exception) -> None:
        pass


class NoOpTracer:
    """No-op tracer that creates NoOpSpan instances."""

    def start_as_current_span(self, name: str) -> NoOpSpan:
        return NoOpSpan()


tracer = NoOpTracer()
"""Module-level tracer singleton. Import and use directly:
    from app.observability.tracing import tracer
    with tracer.start_as_current_span("auth.login") as span:
        span.set_attribute("user.email", email)
"""
