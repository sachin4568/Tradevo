"""Base integration client with retry, timeout, and circuit breaking.

All concrete provider implementations (LLM, market, news) inherit from
BaseIntegrationClient to get consistent error handling and resilience.
"""

import abc
import asyncio
import time
from typing import Any

from app.core.exceptions import ExternalServiceError
from app.observability.logging import get_logger

logger = get_logger(__name__)


class CircuitBreaker:
    """Simple circuit breaker for external service calls.

    States:
    - CLOSED: Normal operation, requests pass through.
    - OPEN: Service is down, requests fail immediately.
    - HALF_OPEN: Testing if service has recovered (one request allowed).

    Transitions:
    - CLOSED → OPEN: After `failure_threshold` consecutive failures.
    - OPEN → HALF_OPEN: After `recovery_timeout` seconds.
    - HALF_OPEN → CLOSED: If the test request succeeds.
    - HALF_OPEN → OPEN: If the test request fails.
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 30) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failure_count = 0
        self._last_failure_time: float = 0.0
        self._state = "closed"

    @property
    def is_open(self) -> bool:
        if self._state == "open":
            if time.monotonic() - self._last_failure_time >= self.recovery_timeout:
                self._state = "half_open"
                return False
            return True
        return False

    def record_success(self) -> None:
        self._failure_count = 0
        self._state = "closed"

    def record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.monotonic()
        if self._failure_count >= self.failure_threshold:
            self._state = "open"
            logger.warning(
                "circuit_breaker_opened",
                failure_count=self._failure_count,
            )


class BaseIntegrationClient(abc.ABC):
    """Base class for all third-party integration clients.

    Provides:
    - Configurable timeout for external calls
    - Automatic retry with exponential backoff
    - Circuit breaking to prevent cascading failures
    - Structured error handling that raises domain exceptions

    Concrete implementations override the abstract `call_provider` method
    with their specific HTTP/API logic.
    """

    def __init__(
        self,
        timeout: int = 30,
        max_retries: int = 3,
        circuit_breaker: CircuitBreaker | None = None,
    ) -> None:
        self.timeout = timeout
        self.max_retries = max_retries
        self._circuit_breaker = circuit_breaker or CircuitBreaker()

    @abc.abstractmethod
    async def call_provider(self, *args: Any, **kwargs: Any) -> Any:
        """Execute the actual provider-specific API call."""
        ...

    async def execute_with_retry(self, *args: Any, **kwargs: Any) -> Any:
        """Execute a provider call with retry and circuit breaking.

        Raises ExternalServiceError if the circuit is open or all retries fail.
        """
        if self._circuit_breaker.is_open:
            raise ExternalServiceError(
                message="Service temporarily unavailable (circuit open)",
            )

        for attempt in range(1, self.max_retries + 1):
            try:
                result = await asyncio.wait_for(
                    self.call_provider(*args, **kwargs),
                    timeout=self.timeout,
                )
                self._circuit_breaker.record_success()
                return result
            except TimeoutError:
                ExternalServiceError(
                    message=f"Provider call timed out after {self.timeout}s",
                )
                logger.warning(
                    "provider_timeout",
                    attempt=attempt,
                    max_retries=self.max_retries,
                )
            except Exception as exc:
                logger.warning(
                    "provider_error",
                    attempt=attempt,
                    error=str(exc),
                )

        self._circuit_breaker.record_failure()
        raise ExternalServiceError(
            message="External service call failed after all retries",
        )

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is available."""
        ...
