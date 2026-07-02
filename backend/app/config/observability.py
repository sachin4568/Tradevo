"""Observability configuration (logging, metrics, tracing)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class ObservabilitySettings(BaseSettings):
    """Observability stack settings.

    Controls structured logging, Prometheus metrics collection,
    and OpenTelemetry distributed tracing.
    """

    METRICS_ENABLED: bool = False
    TRACING_ENABLED: bool = False
    TRACING_EXPORTER: str = "console"
    TRACING_SAMPLING_RATE: float = 1.0
    OTLP_ENDPOINT: str | None = None

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
