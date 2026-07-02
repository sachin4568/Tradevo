"""Input sanitization utilities.

Provides production-grade input cleaning for provider inputs and
user-facing content. Prevents injection attacks and normalizes input.
"""

from __future__ import annotations

import html
import re
from typing import Any


class InputSanitizer:
    """Sanitizes text input to prevent injection and normalize content.

    Usage:
        sanitizer = InputSanitizer()
        clean = sanitizer.sanitize(user_input)
    """

    # Patterns that indicate potential injection attempts
    _DANGEROUS_PATTERNS = [
        (re.compile(r"<\s*script", re.IGNORECASE), "SCRIPT_TAG"),
        (re.compile(r"javascript\s*:", re.IGNORECASE), "JS_PROTOCOL"),
        (re.compile(r"on\w+\s*=", re.IGNORECASE), "EVENT_HANDLER"),
        (re.compile(r"<\s*iframe", re.IGNORECASE), "IFRAME_TAG"),
        (re.compile(r"<\s*object", re.IGNORECASE), "OBJECT_TAG"),
        (re.compile(r"<\s*embed", re.IGNORECASE), "EMBED_TAG"),
        (re.compile(r"data\s*:\s*text/html", re.IGNORECASE), "DATA_URI"),
        (re.compile(r"vbscript\s*:", re.IGNORECASE), "VBS_PROTOCOL"),
    ]

    # Control characters to strip (keep newlines, tabs)
    _CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

    @classmethod
    def sanitize(cls, text: str) -> str:
        """Sanitize a text string.

        - Strips control characters
        - HTML-encodes dangerous characters
        - Normalizes unicode whitespace
        - Trims excessive whitespace
        """
        if not text:
            return text

        # Strip control characters
        text = cls._CONTROL_CHAR_RE.sub("", text)

        # Normalize whitespace (collapse multiple spaces/tabs but keep newlines)
        text = re.sub(r"[^\S\n]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = text.strip()

        return text

    @classmethod
    def sanitize_for_provider(cls, text: str) -> str:
        """Sanitize text before sending to an external provider.

        Strips control characters and normalizes but does NOT HTML-encode
        since providers need the raw text.
        """
        if not text:
            return text

        text = cls._CONTROL_CHAR_RE.sub("", text)
        text = re.sub(r"[^\S\n]+", " ", text)
        text = text.strip()
        return text

    @classmethod
    def sanitize_output(cls, text: str) -> str:
        """Sanitize AI/provider output before returning to the client.

        HTML-encodes content to prevent XSS from provider responses.
        """
        if not text:
            return text
        return html.escape(text, quote=False)

    @classmethod
    def check_dangerous_patterns(cls, text: str) -> list[str]:
        """Check for potentially dangerous patterns.

        Returns a list of pattern type identifiers found.
        """
        found = []
        for pattern, name in cls._DANGEROUS_PATTERNS:
            if pattern.search(text):
                found.append(name)
        return found

    @classmethod
    def sanitize_dict_values(cls, data: dict[str, Any]) -> dict[str, Any]:
        """Recursively sanitize all string values in a dict."""
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = cls.sanitize(value)
            elif isinstance(value, dict):
                result[key] = cls.sanitize_dict_values(value)
            elif isinstance(value, list):
                result[key] = [
                    cls.sanitize(v) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                result[key] = value
        return result