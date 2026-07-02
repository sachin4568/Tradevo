"""AI Response Validator (BA-014).

Validates AI responses before they leave the AI layer. Checks:
- Content presence and minimum length
- Structure requirements based on prompt type
- Content safety (no instruction injection remnants)
- Recommendation presence for analysis prompts

Every AI response must pass validation. Invalid responses are
sanitized or flagged — never exposed raw.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from app.modules.ai.schemas import ValidationResult


@dataclass
class ValidationRule:
    """A single validation rule."""

    name: str
    check_fn: str  # Name of the method on AIResponseValidator
    is_blocking: bool = True  # If True, validation fails on violation


class AIResponseValidator:
    """Validates AI responses based on prompt type and content rules.

    Usage:
        validator = AIResponseValidator()
        result = validator.validate(content, prompt_key="research.company_analysis")
        if not result.is_valid:
            # Handle validation failure
            pass
    """

    # Minimum content lengths by prompt category
    _MIN_LENGTHS: dict[str, int] = {
        "research.company_analysis": 200,
        "research.quick_summary": 50,
        "research.comparison": 150,
        "research.sector_overview": 150,
    }

    # Patterns that indicate content safety issues
    _UNSAFE_PATTERNS: list[re.Pattern[str]] = [
        re.compile(r"ignore\s+(?:previous|above)\s+(?:instructions?|prompts?)", re.I),
        re.compile(r"system\s*:\s*", re.I),
        re.compile(r"<\|im_start\|>", re.I),
        re.compile(r"<\|im_end\|>", re.I),
    ]

    # Patterns for instruction injection attempts
    _INJECTION_PATTERNS: list[re.Pattern[str]] = [
        re.compile(r"you\s+are\s+now\b", re.I),
        re.compile(r"new\s+instructions?\s*:", re.I),
        re.compile(r"pretend\s+(?:you\s+are|to\s+be)", re.I),
    ]

    def validate(
        self,
        content: str,
        *,
        prompt_key: str = "",
        context: dict[str, Any] | None = None,
    ) -> ValidationResult:
        """Validate an AI response.

        Runs all applicable validation rules. Non-blocking rules
        generate warnings; blocking rules cause validation failure.

        Args:
            content: The AI response content to validate.
            prompt_key: The prompt that generated this response.
            context: Original request context for cross-validation.

        Returns:
            ValidationResult with is_valid, errors, warnings, and
            optionally sanitized content.
        """
        errors: list[str] = []
        warnings: list[str] = []

        # Rule 1: Content presence
        self._check_content_presence(content, errors)

        # Rule 2: Minimum length
        min_len = self._get_min_length(prompt_key)
        self._check_min_length(content, min_len, warnings)

        # Rule 3: Content safety
        self._check_safety(content, errors, warnings)

        # Rule 4: Instruction injection
        self._check_injection(content, warnings)

        # Rule 5: Recommendation for analysis prompts
        if "analysis" in prompt_key:
            self._check_recommendation(content, warnings)

        # Rule 6: Context consistency (non-blocking)
        if context:
            self._check_context_consistency(content, context, warnings)

        sanitized = self._sanitize_if_needed(content, errors, warnings)

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_content=sanitized,
        )

    def _check_content_presence(
        self, content: str, errors: list[str]
    ) -> None:
        """Ensure content is not empty or whitespace-only."""
        if not content or not content.strip():
            errors.append("AI response is empty")

    def _check_min_length(
        self, content: str, min_length: int, warnings: list[str]
    ) -> None:
        """Warn if content is suspiciously short."""
        if min_length > 0 and len(content.strip()) < min_length:
            warnings.append(
                f"Response length ({len(content.strip())} chars) "
                f"is below minimum ({min_length}) for this prompt type"
            )

    def _check_safety(
        self, content: str, errors: list[str], warnings: list[str]
    ) -> None:
        """Check for unsafe content patterns."""
        for pattern in self._UNSAFE_PATTERNS:
            if pattern.search(content):
                errors.append(
                    f"Unsafe content pattern detected: {pattern.pattern}"
                )
                break

    def _check_injection(
        self, content: str, warnings: list[str]
    ) -> None:
        """Check for potential instruction injection remnants."""
        for pattern in self._INJECTION_PATTERNS:
            if pattern.search(content):
                warnings.append(
                    f"Potential instruction injection remnant: {pattern.pattern}"
                )

    def _check_recommendation(
        self, content: str, warnings: list[str]
    ) -> None:
        """Check if analysis contains a recommendation."""
        has_rec = bool(
            re.search(
                r"\b(buy|hold|sell|strong buy|strong sell)\b",
                content,
                re.IGNORECASE,
            )
        )
        if not has_rec:
            warnings.append("Analysis missing explicit investment recommendation")

    def _check_context_consistency(
        self, content: str, context: dict[str, Any], warnings: list[str]
    ) -> None:
        """Verify the response references context data (non-blocking)."""
        company_name = context.get("company_name", "")
        symbol = context.get("symbol", "")

        if company_name and company_name.lower() not in content.lower():
            warnings.append(
                f"Response does not reference company name '{company_name}'"
            )

        if symbol and symbol.lower() not in content.lower():
            warnings.append(
                f"Response does not reference symbol '{symbol}'"
            )

    def _sanitize_if_needed(
        self, content: str, errors: list[str], warnings: list[str]
    ) -> str | None:
        """Return sanitized content if errors exist that can be fixed."""
        if not errors:
            return None

        sanitized = content
        # Strip any unsafe patterns
        for pattern in self._UNSAFE_PATTERNS:
            sanitized = pattern.sub("", sanitized)

        # Strip injection patterns
        for pattern in self._INJECTION_PATTERNS:
            sanitized = pattern.sub("", sanitized)

        if sanitized != content:
            return sanitized.strip()
        return None

    def _get_min_length(self, prompt_key: str) -> int:
        """Get the minimum content length for a prompt type."""
        # Check exact match first
        if prompt_key in self._MIN_LENGTHS:
            return self._MIN_LENGTHS[prompt_key]
        # Check by category prefix
        for key, length in self._MIN_LENGTHS.items():
            if prompt_key.startswith(key.rsplit(".", 1)[0]):
                return length
        return 0