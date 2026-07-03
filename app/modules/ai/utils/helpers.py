"""Shared AI helper utilities.

Centralises helper logic that was previously duplicated across
engines, API endpoints, and services.  Every helper is a pure
function with no side-effects so it is trivially testable.
"""

from __future__ import annotations

import time
from typing import Any

from app.modules.ai.schemas import AIResponseEnvelope


def build_provenance(
    *,
    engine: str,
    prompt_key: str,
    provider: str,
    model: str,
    correlation_id: str,
    prompt_version: int = 1,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a standardised provenance metadata dict.

    Every AI engine must attach provenance to its response.  This
    helper ensures a consistent shape across all engines.
    """
    prov: dict[str, Any] = {
        "engine": engine,
        "promptKey": prompt_key,
        "provider": provider,
        "model": model,
        "correlationId": correlation_id,
        "promptVersion": prompt_version,
        "timestamp": current_timestamp_ms(),
    }
    if extra:
        prov.update(extra)
    return prov


def current_timestamp_ms() -> int:
    """Return current UTC time as milliseconds since epoch."""
    return int(time.time() * 1000)


def envelope_to_api_dict(response: AIResponseEnvelope) -> dict[str, Any]:
    """Convert an AIResponseEnvelope to a camelCase dict for API responses.

    This is the single canonical conversion.  No endpoint or service
    should construct this dict manually.
    """
    return {
        "content": response.content,
        "provider": response.provider,
        "model": response.model,
        "correlationId": response.correlation_id,
        "promptKey": response.prompt_key,
        "promptVersion": response.prompt_version,
        "cached": response.cached,
        "durationMs": response.duration_ms,
        "usage": response.usage,
        "validation": {
            "isValid": response.validation.is_valid,
            "warnings": response.validation.warnings,
            "errors": response.validation.errors,
        },
        "sections": [
            {"title": s.title, "content": s.content, "order": s.order}
            for s in response.parsed_sections
        ],
        "provenance": build_provenance(
            engine=response.metadata.get("engine", ""),
            prompt_key=response.prompt_key,
            provider=response.provider,
            model=response.model,
            correlation_id=response.correlation_id,
            prompt_version=response.prompt_version,
        ),
    }


def merge_contexts(*dicts: dict[str, Any]) -> dict[str, Any]:
    """Merge multiple context dicts into one.

    Later dicts override earlier ones on key collisions.
    Empty / None dicts are skipped.
    """
    merged: dict[str, Any] = {}
    for d in dicts:
        if d:
            merged.update(d)
    return merged
