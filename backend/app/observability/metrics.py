"""Production metrics collector.

Provides in-process metrics collection with optional Prometheus export.
Active when METRICS_ENABLED=true in settings.
"""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class _Counter:
    """A counter metric."""
    value: int = 0
    tags: dict[str, str] = field(default_factory=dict)


@dataclass
class _Histogram:
    """A histogram metric with bucketed observations."""
    values: list[float] = field(default_factory=list)
    tags: dict[str, str] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def record(self, value: float) -> None:
        with self._lock:
            self.values.append(value)
            if len(self.values) > 10000:
                self.values = self.values[-5000:]

    def stats(self) -> dict[str, float]:
        with self._lock:
            if not self.values:
                return {"count": 0, "min": 0, "max": 0, "avg": 0, "p50": 0, "p95": 0, "p99": 0}
            s = sorted(self.values)
            n = len(s)
            return {
                "count": n,
                "min": s[0],
                "max": s[-1],
                "avg": sum(s) / n,
                "p50": s[n // 2],
                "p95": s[int(n * 0.95)] if n > 1 else s[0],
                "p99": s[int(n * 0.99)] if n > 1 else s[0],
            }


@dataclass
class _Gauge:
    """A gauge metric representing a point-in-time value."""
    value: float = 0.0
    tags: dict[str, str] = field(default_factory=dict)


class MetricsCollector:
    """In-process metrics collector.

    Supports counters, histograms, and gauges with tag-based
    segmentation. Provides a snapshot of all metrics for
    health endpoints and future Prometheus export.
    """

    def __init__(self, enabled: bool = False) -> None:
        self._enabled = enabled
        self._lock = threading.Lock()
        self._counters: dict[str, _Counter] = defaultdict(_Counter)
        self._histograms: dict[str, _Histogram] = {}
        self._gauges: dict[str, _Gauge] = defaultdict(_Gauge)

    @property
    def enabled(self) -> bool:
        return self._enabled

    def increment(self, name: str, tags: dict[str, str] | None = None) -> None:
        """Increment a counter metric."""
        if not self._enabled:
            return
        key = self._metric_key(name, tags)
        with self._lock:
            self._counters[key].value += 1
            if tags:
                self._counters[key].tags = tags

    def histogram(self, name: str, value: float, tags: dict[str, str] | None = None) -> None:
        """Record a value in a histogram."""
        if not self._enabled:
            return
        key = self._metric_key(name, tags)
        with self._lock:
            if key not in self._histograms:
                self._histograms[key] = _Histogram(tags=tags or {})
            self._histograms[key].record(value)

    def gauge(self, name: str, value: float, tags: dict[str, str] | None = None) -> None:
        """Set a gauge metric value."""
        if not self._enabled:
            return
        key = self._metric_key(name, tags)
        with self._lock:
            self._gauges[key].value = value
            if tags:
                self._gauges[key].tags = tags

    def snapshot(self) -> dict[str, Any]:
        """Return a snapshot of all collected metrics."""
        with self._lock:
            counters = {
                k: {"value": v.value, "tags": v.tags}
                for k, v in self._counters.items()
            }
            histograms = {
                k: {**v.stats(), "tags": v.tags}
                for k, v in self._histograms.items()
            }
            gauges = {
                k: {"value": v.value, "tags": v.tags}
                for k, v in self._gauges.items()
            }
        return {
            "counters": counters,
            "histograms": histograms,
            "gauges": gauges,
            "enabled": self._enabled,
        }

    def reset(self) -> None:
        """Reset all metrics."""
        with self._lock:
            self._counters.clear()
            self._histograms.clear()
            self._gauges.clear()

    @staticmethod
    def _metric_key(name: str, tags: dict[str, str] | None) -> str:
        if not tags:
            return name
        tag_str = ",".join(f"{k}={v}" for k, v in sorted(tags.items()))
        return f"{name}{{{tag_str}}}"


# Module-level singleton — initialized on first import
_metrics: MetricsCollector | None = None


def get_metrics() -> MetricsCollector:
    """Get the module-level MetricsCollector instance."""
    global _metrics
    if _metrics is None:
        from app.config import get_settings
        settings = get_settings()
        _metrics = MetricsCollector(enabled=settings.METRICS_ENABLED)
    return _metrics


def reset_metrics() -> None:
    """Reset the global metrics instance."""
    global _metrics
    if _metrics:
        _metrics.reset()
    _metrics = None