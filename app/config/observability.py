"""Observability configuration (logging, metrics, tracing).

Production-ready settings for the full observability stack.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class ObservabilitySettings(BaseSettings):
    """Observability stack settings.

    Controls structured logging, metrics collection,
    and OpenTelemetry distributed tracing.
    """

    METRICS_ENABLED: bool = False
    TRACING_ENABLED: bool = False
    TRACING_EXPORTER: str = "console"
    TRACING_SAMPLING_RATE: float = 1.0
    OTLP_ENDPOINT: str | None = None

    # ─── Security ───
    REQUEST_MAX_SIZE_MB: int = 10
    SECURITY_HEADERS_ENABLED: bool = True
    INPUT_SANITIZATION_ENABLED: bool = True

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
