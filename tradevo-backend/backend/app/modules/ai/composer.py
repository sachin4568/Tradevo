"""AI Response Composer (Milestone 7.1).

Centralises the construction of AIResponseEnvelope objects.
Every AI engine must use this composer instead of manually
building envelopes.  The composer attaches provenance metadata,
correlation ID, provider information, validation metadata, and
cache metadata in a single, consistent location.

Architecture:
    AI Engine → ResponseComposer → AIResponseEnvelope
"""

from __future__ import annotations

import logging
from typing import Any

from app.modules.ai.schemas import (
    AIResponseEnvelope,
    ParsedSection,
    ValidationResult,
)
from app.modules.ai.utils.helpers import build_provenance

logger = logging.getLogger(__name__)


class ResponseComposer:
    """Builds AIResponseEnvelope objects with full metadata attachment.

    Usage:
        composer = ResponseComposer(engine_name="dna")
        envelope = composer.compose(
            content="Generated text...",
            provider="openai",
            model="gpt-4",
            correlation_id="ai-abc123",
            prompt_key="dna.behaviour_analysis",
            parsed_sections=[...],
            validation=validation_result,
            usage={"prompt_tokens": 100, ...},
            cached=False,
            duration_ms=450,
        )
    """

    def __init__(self, *, engine: str) -> None:
        self._engine = engine

    def compose(
        self,
        *,
        content: str,
        provider: str,
        model: str,
        correlation_id: str,
        prompt_key: str,
        prompt_version: int = 1,
        parsed_sections: list[ParsedSection] | None = None,
        validation: ValidationResult | None = None,
        usage: dict[str, int] | None = None,
        cached: bool = False,
        duration_ms: int = 0,
        extra_metadata: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope:
        """Build a fully-annotated AIResponseEnvelope.

        Args:
            content: The AI-generated text content.
            provider: Provider name (e.g. 'openai', 'mock').
            model: Model identifier (e.g. 'gpt-4').
            correlation_id: Unique request correlation ID.
            prompt_key: Prompt registry key used.
            prompt_version: Prompt version number.
            parsed_sections: Sections extracted by the parser.
            validation: Validation result from the validator.
            usage: Token usage stats.
            cached: Whether the response was served from cache.
            duration_ms: Total generation duration in milliseconds.
            extra_metadata: Additional engine-specific metadata.

        Returns:
            A complete AIResponseEnvelope with all metadata.
        """
        metadata: dict[str, Any] = {
            "engine": self._engine,
            "provenance": build_provenance(
                engine=self._engine,
                prompt_key=prompt_key,
                provider=provider,
                model=model,
                correlation_id=correlation_id,
                prompt_version=prompt_version,
            ),
        }
        if extra_metadata:
            metadata.update(extra_metadata)

        return AIResponseEnvelope(
            content=content,
            provider=provider,
            model=model,
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            prompt_version=prompt_version,
            parsed_sections=parsed_sections or [],
            validation=validation
            or ValidationResult(is_valid=True, errors=[], warnings=[]),
            usage=usage
            or {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            },
            metadata=metadata,
            cached=cached,
            duration_ms=duration_ms,
        )

    def compose_from_envelope(
        self,
        envelope: AIResponseEnvelope,
        *,
        extra_metadata: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope:
        """Re-compose an existing envelope, injecting engine provenance.

        Used when an AI engine receives an envelope from AIRequestManager
        and needs to add engine-level metadata before returning it.
        """
        metadata = dict(envelope.metadata)
        metadata["engine"] = self._engine
        metadata["provenance"] = build_provenance(
            engine=self._engine,
            prompt_key=envelope.prompt_key,
            provider=envelope.provider,
            model=envelope.model,
            correlation_id=envelope.correlation_id,
            prompt_version=envelope.prompt_version,
        )
        if extra_metadata:
            metadata.update(extra_metadata)

        return AIResponseEnvelope(
            content=envelope.content,
            provider=envelope.provider,
            model=envelope.model,
            correlation_id=envelope.correlation_id,
            prompt_key=envelope.prompt_key,
            prompt_version=envelope.prompt_version,
            parsed_sections=envelope.parsed_sections,
            validation=envelope.validation,
            usage=envelope.usage,
            metadata=metadata,
            cached=envelope.cached,
            duration_ms=envelope.duration_ms,
        )
