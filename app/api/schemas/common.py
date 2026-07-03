"""Shared response envelope and common schemas.

ApiResponse[T] wraps all successful responses, matching the frontend's
existing ApiError type contract in types/api.ts.
"""

from typing import Any, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse[T](BaseModel):
    """Standard success response envelope.

    Matches the frontend contract: { success: true, message: "...", data: T }
    """

    success: bool = True
    message: str = "Operation successful"
    data: Any


class ApiErrorResponse(BaseModel):
    """Standard error response envelope.

    Matches the frontend contract: { success: false, message: "...", errorCode: "..." }
    """

    success: bool = False
    message: str
    errorCode: str


class PaginationParams(BaseModel):
    """Standard pagination parameters for list endpoints."""

    page: int = Field(ge=1, default=1)
    per_page: int = Field(ge=1, le=100, default=20)


class PaginationMeta(BaseModel):
    """Pagination metadata included in paginated list responses."""

    page: int
    per_page: int
    total: int
    total_pages: int
