"""AI Execution Platform schemas.

Pydantic models for AI request/response contracts. These schemas
enforce structure on every AI interaction — raw provider responses
never leave the AI layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field


# ─── Enums ───


class AIRequestStatus(str, Enum):
    """Lifecycle states for an AI request."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    CACHED = "cached"


class AIProviderName(str, Enum):
    """Supported AI provider identifiers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MOCK = "mock"


class AIRequestType(str, Enum):
    """Types of AI requests."""

    GENERATE = "generate"
    CHAT = "chat"


# ─── Request Schemas ───


@dataclass
class AIRequest:
    """Internal AI request representation.

    Every AI call is wrapped in this structure before reaching
    any provider. Carries correlation ID, timing, and metadata
    through the entire pipeline.
    """

    correlation_id: str
    request_type: AIRequestType
    prompt: str = ""
    messages: list[dict[str, str]] = field(default_factory=list)
    context: dict[str, Any] = field(default_factory=dict)
    config: dict[str, Any] = field(default_factory=dict)
    prompt_key: str = ""
    prompt_version: int = 1
    provider_name: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


# ─── Response Schemas ───


class ParsedSection(BaseModel):
    """A single section extracted from an AI response."""

    title: str
    content: str
    order: int = 0


class ValidationResult(BaseModel):
    """Result of validating an AI response."""

    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    sanitized_content: str | None = None


class AIResponseEnvelope(BaseModel):
    """Validated, parsed AI response envelope.

    This is the ONLY type that leaves the AI layer.
    Raw provider responses are never exposed.
    """

    content: str
    provider: str
    model: str
    correlation_id: str
    prompt_key: str = ""
    prompt_version: int = 1
    parsed_sections: list[ParsedSection] = Field(default_factory=list)
    validation: ValidationResult = Field(
        default_factory=lambda: ValidationResult(
            is_valid=True, errors=[], warnings=[]
        )
    )
    usage: dict[str, int] = Field(
        default_factory=lambda: {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        }
    )
    metadata: dict[str, Any] = Field(default_factory=dict)
    cached: bool = False
    duration_ms: int = 0


# ─── Telemetry Schemas ───


class AITelemetryEvent(BaseModel):
    """Telemetry data for a single AI request/response cycle."""

    correlation_id: str
    prompt_key: str
    provider: str
    model: str
    request_type: AIRequestType
    status: AIRequestStatus
    duration_ms: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cached: bool = False
    error: str | None = None
    retry_count: int = 0
    circuit_breaker_open: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


# ─── Cache Schemas ───


class CacheEntry(BaseModel, Generic[TypeVar("T")]):
    """A cached AI response entry."""

    key: str
    value: Any
    prompt_key: str
    prompt_version: int
    created_at: float  # monotonic timestamp
    ttl_seconds: float = 300.0  # 5 minutes default


# ─── Streaming Interfaces ───


class StreamChunk(BaseModel):
    """A single chunk in a streaming AI response (interface only)."""

    correlation_id: str
    content: str
    provider: str
    model: str
    chunk_index: int = 0
    is_final: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class StreamSession(BaseModel):
    """Metadata for an active streaming session (interface only)."""

    correlation_id: str
    prompt_key: str
    provider: str
    model: str
    status: AIRequestStatus = AIRequestStatus.PENDING
    total_chunks: int = 0
    total_tokens: int = 0
    metadata: dict[str, Any] = Field(default_factory=dict)