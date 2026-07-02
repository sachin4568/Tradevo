"""Metrics collection scaffolding.

Reserved for Prometheus metrics integration. When METRICS_ENABLED=true,
this module will expose a /metrics endpoint with request latency histograms,
error counters, and business-level gauges.

Currently provides a no-op interface so that instrumentation calls
can be added to code without conditional checks.
"""


class MetricsCollector:
    """No-op metrics collector.

    When observability is enabled, this will be replaced with a real
    Prometheus client implementation. The interface remains the same
    so calling code does not need to change.
    """

    def increment(self, name: str, tags: dict[str, str] | None = None) -> None:
        """Increment a counter metric."""

    def histogram(self, name: str, value: float, tags: dict[str, str] | None = None) -> None:
        """Record a value in a histogram."""

    def gauge(self, name: str, value: float, tags: dict[str, str] | None = None) -> None:
        """Set a gauge metric value."""


metrics = MetricsCollector()
"""Module-level metrics singleton. Import and use directly:
    from app.observability.metrics import metrics
    metrics.increment("requests_total", {"endpoint": "/auth/login"})
"""
