"""AI Response Parser (BA-013).

Extracts structured data from raw LLM text output. Supports:
- Section extraction (markdown headings)
- Key-value extraction
- Recommendation extraction (Buy/Hold/Sell)
- Content sanitization

Every AI response passes through the parser before leaving the AI layer.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.modules.ai.schemas import ParsedSection


@dataclass
class ParsedResponse:
    """Result of parsing an AI response."""

    content: str
    sections: list[ParsedSection]
    recommendation: str | None
    key_findings: list[str]
    confidence_indicators: list[str]
    sanitized: bool


class AIResponseParser:
    """Parses raw LLM output into structured data.

    Usage:
        parser = AIResponseParser()
        parsed = parser.parse(raw_content, prompt_key="research.company_analysis")
    """

    # Common markdown heading patterns
    _HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.+?)$", re.MULTILINE)

    # Recommendation patterns
    _RECOMMENDATION_PATTERNS = [
        re.compile(
            r"(?:recommendation|verdict|action)\s*[:\-—]\s*(buy|hold|sell|strong buy|strong sell)",
            re.IGNORECASE,
        ),
        re.compile(
            r"\*\*(buy|hold|sell|strong buy|strong sell)\*\*",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:i\s+(?:recommend|suggest|advise))\s+(.+?)(?:\.|$)",
            re.IGNORECASE,
        ),
        re.compile(
            r"\b(buy|hold|sell|strong buy|strong sell)\b",
            re.IGNORECASE,
        ),
    ]

    def parse(
        self,
        content: str,
        *,
        prompt_key: str = "",
        parse_sections: bool = True,
        extract_recommendation: bool = True,
        sanitize: bool = True,
    ) -> ParsedResponse:
        """Parse raw LLM content into structured data.

        Args:
            content: Raw text from the LLM.
            prompt_key: The prompt that generated this response (for context).
            parse_sections: Whether to extract markdown sections.
            extract_recommendation: Whether to look for buy/hold/sell signals.
            sanitize: Whether to sanitize the content.

        Returns:
            ParsedResponse with structured data.
        """
        if not content:
            return ParsedResponse(
                content="",
                sections=[],
                recommendation=None,
                key_findings=[],
                confidence_indicators=[],
                sanitized=False,
            )

        working = content

        # Sanitize first
        was_sanitized = False
        if sanitize:
            working = self._sanitize(working)
            was_sanitized = working != content

        # Extract sections
        sections: list[ParsedSection] = []
        if parse_sections:
            sections = self._extract_sections(working)

        # Extract recommendation
        recommendation = None
        if extract_recommendation:
            recommendation = self._extract_recommendation(working)

        # Extract key findings
        key_findings = self._extract_key_findings(working)

        # Extract confidence indicators
        confidence = self._extract_confidence_indicators(working)

        return ParsedResponse(
            content=working,
            sections=sections,
            recommendation=recommendation,
            key_findings=key_findings,
            confidence_indicators=confidence,
            sanitized=was_sanitized,
        )

    def _sanitize(self, content: str) -> str:
        """Clean up common LLM output artifacts.

        Removes:
        - Excessive whitespace (3+ newlines → 2)
        - Trailing whitespace on lines
        - "As an AI..." disclaimers
        - XML-style thinking tags
        """
        # Remove thinking tags
        cleaned = re.sub(r"<thinking>.*?</thinking>", "", content, flags=re.DOTALL)
        cleaned = re.sub(r"</?think>", "", cleaned, flags=re.DOTALL)

        # Remove common AI disclaimers (but keep substantive content)
        cleaned = re.sub(
            r"(?:as an ai|as a language model)\s*,?\s*[^.]*\.",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"(?:this is (?:a )?(?:mock|simulated|development)(?:\s+\w+)*\s+(?:response|analysis|content)[^.]*\.)",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )

        # Normalize whitespace
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        cleaned = re.sub(r"[ \t]+$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

        return cleaned

    def _extract_sections(self, content: str) -> list[ParsedSection]:
        """Extract sections from markdown headings."""
        sections: list[ParsedSection] = []
        lines = content.split("\n")
        current_title = "Overview"
        current_lines: list[str] = []
        order = 0

        for line in lines:
            match = self._HEADING_PATTERN.match(line)
            if match:
                # Save previous section
                if current_lines:
                    section_content = "\n".join(current_lines).strip()
                    if section_content:
                        sections.append(ParsedSection(
                            title=current_title,
                            content=section_content,
                            order=order,
                        ))
                        order += 1
                current_title = match.group(2).strip()
                current_lines = []
            else:
                current_lines.append(line)

        # Don't forget the last section
        if current_lines:
            section_content = "\n".join(current_lines).strip()
            if section_content:
                sections.append(ParsedSection(
                    title=current_title,
                    content=section_content,
                    order=order,
                ))

        return sections

    def _extract_recommendation(self, content: str) -> str | None:
        """Extract investment recommendation (Buy/Hold/Sell)."""
        for pattern in self._RECOMMENDATION_PATTERNS:
            match = pattern.search(content)
            if match:
                rec = match.group(1).strip().lower()
                # Normalize
                if rec in ("strong buy",):
                    return "Strong Buy"
                if rec in ("strong sell",):
                    return "Strong Sell"
                return rec.capitalize()
        return None

    def _extract_key_findings(self, content: str) -> list[str]:
        """Extract bullet-point key findings."""
        findings: list[str] = []
        # Match lines starting with -, *, or numbered lists
        pattern = re.compile(r"^\s*(?:[-*]|\d+\.)\s+(.+)$", re.MULTILINE)
        for match in pattern.finditer(content):
            finding = match.group(1).strip()
            if len(finding) >= 10 and len(finding) < 500:
                findings.append(finding)
        return findings[:10]  # Cap at 10

    def _extract_confidence_indicators(self, content: str) -> list[str]:
        """Extract phrases that indicate confidence or uncertainty."""
        indicators: list[str] = []

        high_confidence = [
            r"\bstrongly\s+(?:recommend|suggest|believe)\b",
            r"\bclear\s+(?:evidence|sign|indication)\b",
            r"\bwell\s+positioned\b",
            r"\bsolid\s+(?:fundamentals|growth|performance)\b",
        ]
        low_confidence = [
            r"\buncertain(?:ty)?\b",
            r"\brisk\s+(?:of|remains|is)\b",
            r"\bcaution\b",
            r"\bvolatile\b",
            r"\bcannot\s+(?:be|predict)\b",
        ]

        for pat in high_confidence:
            if re.search(pat, content, re.IGNORECASE):
                indicators.append("high_confidence")

        for pat in low_confidence:
            if re.search(pat, content, re.IGNORECASE):
                indicators.append("low_confidence")

        # Deduplicate while preserving order
        seen: set[str] = set()
        unique: list[str] = []
        for ind in indicators:
            if ind not in seen:
                seen.add(ind)
                unique.append(ind)

        return unique

    def to_dict(
        self,
        parsed: ParsedResponse,
    ) -> dict[str, Any]:
        """Convert a ParsedResponse to a dict for API responses."""
        return {
            "content": parsed.content,
            "sections": [
                {"title": s.title, "content": s.content, "order": s.order}
                for s in parsed.sections
            ],
            "recommendation": parsed.recommendation,
            "keyFindings": parsed.key_findings,
            "confidenceIndicators": parsed.confidence_indicators,
            "sanitized": parsed.sanitized,
        }
