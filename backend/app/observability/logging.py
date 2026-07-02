"""Structured logging setup using structlog.

Provides a factory function `setup_logging()` called during app startup
and a `get_logger()` function used throughout the codebase.

Log entries are structured as key-value pairs, making them parseable
by log aggregation systems (ELK, CloudWatch, etc.).
"""

import logging
import sys

import structlog


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structlog for the application.

    Sets up structlog with:
    - Timestamps in ISO 8601 format
    - Log level filtering
    - Console output with colored rendering in development
    - JSON output for production log aggregation

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR).
    """
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.ExtraAdder(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

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

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.processors.JSONRenderer()
            if log_level.upper() in ("WARNING", "ERROR", "CRITICAL")
            else structlog.dev.ConsoleRenderer(),
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger for a module.

    Usage:
        from app.observability.logging import get_logger
        logger = get_logger(__name__)
        logger.info("user_registered", user_id=user.id, email=user.email)

    Args:
        name: Logger name (typically __name__ of the calling module).

    Returns:
        A structlog BoundLogger instance.
    """
    return structlog.get_logger(name)
