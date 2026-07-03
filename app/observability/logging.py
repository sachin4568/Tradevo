"""Structured logging setup.

Provides a factory function `setup_logging()` called during app startup
and a `get_logger()` function used throughout the codebase.

In production (LOG_LEVEL=WARNING/ERROR/CRITICAL), outputs structured JSON
logs parseable by ELK, CloudWatch, Datadog, etc. In development, uses
colored console output for readability.
"""

import logging
import os
import sys

import structlog


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application.

    Production (WARNING+): JSON output to stdout for log aggregation.
    Development: colored console output for readability.

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR).
    """
    is_json = log_level.upper() in ("WARNING", "ERROR", "CRITICAL") or os.getenv("LOG_FORMAT") == "json"

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.ExtraAdder(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if is_json:
        shared_processors.append(_add_request_id)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    renderer = structlog.processors.JSONRenderer() if is_json else structlog.dev.ConsoleRenderer()

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def _add_request_id(
    logger: logging.Logger,
    method_name: str,
    event_dict: dict,
) -> dict:
    """Add request_id from context vars if available."""
    try:
        request_id = event_dict.get("request_id")
        if request_id:
            event_dict["request_id"] = request_id
    except Exception:
        pass
    return event_dict


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger for a module.

    Usage:
        from app.observability.logging import get_logger
        logger = get_logger(__name__)
        logger.info("user_registered", user_id=user.id)

    Args:
        name: Logger name (typically __name__ of the calling module).

    Returns:
        A structlog BoundLogger instance.
    """
    return structlog.get_logger(name)
