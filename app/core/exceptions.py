"""Tradevo exception hierarchy.

All domain and infrastructure exceptions inherit from TradevoBaseError.
The API layer's global exception handler maps each exception subclass
to the appropriate HTTP status code and error response envelope.
"""


class TradevoBaseError(Exception):
    """Base exception for all Tradevo errors.

    Attributes:
        message: Human-readable error description.
        error_code: Machine-readable error code (e.g., "INSUFFICIENT_FUNDS").
        status_code: HTTP status code to return to the client.
    """

    def __init__(
        self,
        message: str = "An error occurred",
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
    ) -> None:
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(self.message)


# ─── Domain Errors (400) ───


class DomainError(TradevoBaseError):
    """Base for business logic violations."""

    def __init__(self, message: str = "Business rule violated", error_code: str = "DOMAIN_ERROR") -> None:
        super().__init__(message=message, error_code=error_code, status_code=400)


class InsufficientFundsError(DomainError):
    def __init__(self, message: str = "Insufficient virtual cash to complete this transaction") -> None:
        super().__init__(message=message, error_code="INSUFFICIENT_FUNDS")


class InsufficientSharesError(DomainError):
    def __init__(self, message: str = "Not enough shares to sell") -> None:
        super().__init__(message=message, error_code="INSUFFICIENT_SHARES")


class DuplicateResourceError(TradevoBaseError):
    def __init__(self, message: str = "Resource already exists", error_code: str = "DUPLICATE_RESOURCE") -> None:
        super().__init__(message=message, error_code=error_code, status_code=409)


class InvalidTransactionError(DomainError):
    def __init__(self, message: str = "Invalid transaction") -> None:
        super().__init__(message=message, error_code="INVALID_TRANSACTION")


class BusinessRuleViolationError(DomainError):
    def __init__(self, message: str = "Business rule violated", error_code: str = "BUSINESS_RULE_VIOLATION") -> None:
        super().__init__(message=message, error_code=error_code)


# ─── Authentication Errors (401) ───


class AuthenticationError(TradevoBaseError):
    def __init__(self, message: str = "Authentication failed", error_code: str = "AUTHENTICATION_ERROR") -> None:
        super().__init__(message=message, error_code=error_code, status_code=401)


class InvalidCredentialsError(AuthenticationError):
    def __init__(self, message: str = "Invalid email or password") -> None:
        super().__init__(message=message, error_code="INVALID_CREDENTIALS")


class TokenExpiredError(AuthenticationError):
    def __init__(self, message: str = "Token has expired") -> None:
        super().__init__(message=message, error_code="TOKEN_EXPIRED")


class TokenRevokedError(AuthenticationError):
    def __init__(self, message: str = "Token has been revoked") -> None:
        super().__init__(message=message, error_code="TOKEN_REVOKED")


# ─── Authorization Errors (403) ───


class AuthorizationError(TradevoBaseError):
    def __init__(self, message: str = "Access denied", error_code: str = "AUTHORIZATION_ERROR") -> None:
        super().__init__(message=message, error_code=error_code, status_code=403)


# ─── Not Found Errors (404) ───


class NotFoundError(TradevoBaseError):
    def __init__(self, message: str = "Resource not found", error_code: str = "NOT_FOUND") -> None:
        super().__init__(message=message, error_code=error_code, status_code=404)


# ─── Validation Errors (422) ───


class ValidationError(TradevoBaseError):
    def __init__(self, message: str = "Validation failed", error_code: str = "VALIDATION_ERROR") -> None:
        super().__init__(message=message, error_code=error_code, status_code=422)


class SchemaValidationError(ValidationError):
    def __init__(self, message: str = "Request schema validation failed") -> None:
        super().__init__(message=message, error_code="SCHEMA_VALIDATION_ERROR")


# ─── Rate Limit Errors (429) ───


class RateLimitExceededError(TradevoBaseError):
    def __init__(self, message: str = "Rate limit exceeded", error_code: str = "RATE_LIMIT_EXCEEDED") -> None:
        super().__init__(message=message, error_code=error_code, status_code=429)


# ─── External Service Errors (502) ───


class ExternalServiceError(TradevoBaseError):
    def __init__(self, message: str = "External service unavailable", error_code: str = "EXTERNAL_SERVICE_ERROR") -> None:
        super().__init__(message=message, error_code=error_code, status_code=502)


class LLMServiceUnavailableError(ExternalServiceError):
    def __init__(self, message: str = "AI service is currently unavailable") -> None:
        super().__init__(message=message, error_code="LLM_SERVICE_UNAVAILABLE")


class MarketDataUnavailableError(ExternalServiceError):
    def __init__(self, message: str = "Market data service is currently unavailable") -> None:
        super().__init__(message=message, error_code="MARKET_DATA_UNAVAILABLE")


class NewsServiceUnavailableError(ExternalServiceError):
    def __init__(self, message: str = "News service is currently unavailable") -> None:
        super().__init__(message=message, error_code="NEWS_SERVICE_UNAVAILABLE")


# ─── Internal Errors (500) ───


class InternalError(TradevoBaseError):
    def __init__(self, message: str = "An internal error occurred") -> None:
        super().__init__(message=message, error_code="INTERNAL_ERROR", status_code=500)
