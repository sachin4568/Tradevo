"""Research Assembler (Milestone 7.1).

Merges deterministic research data, AI-generated sections, and
provenance metadata into the final ResearchReport structure.
ResearchService orchestrates only; this class handles assembly.

Responsibilities:
- Merge deterministic data (company info, financials, prices)
- Merge AI-generated content sections
- Merge provenance metadata (provider, model, correlation ID, tokens)
- Build the final dict representation for persistence / API response
"""

from __future__ import annotations

import logging
from typing import Any

from app.modules.ai.utils.helpers import build_provenance
from app.modules.ai.schemas import AIResponseEnvelope

logger = logging.getLogger(__name__)


class ResearchAssembler:
    """Assembles a research report from component parts.

    Usage:
        assembler = ResearchAssembler()
        report_dict = assembler.assemble(
            company=company,
            user=user,
            ai_response=envelope,
            source_type="manual",
        )
    """

    def assemble(
        self,
        *,
        company: Any,
        user: Any,
        ai_response: AIResponseEnvelope,
        source_type: str = "manual",
    ) -> dict:
        """Build the final research report dict.

        Merges deterministic company/user data with AI-generated
        content and provenance metadata into a single structure
        suitable for both persistence and API response.

        Args:
            company: Company SQLAlchemy model.
            user: User SQLAlchemy model.
            ai_response: Validated AI response envelope.
            source_type: 'manual', 'auto', or 'scheduled'.

        Returns:
            Dict with merged deterministic + AI + provenance data.
        """
        deterministic = self._build_deterministic_data(company, user)
        ai_content = self._build_ai_content(ai_response)
        provenance = self._build_provenance(ai_response, source_type)

        report = {
            **deterministic,
            **ai_content,
            "sourceType": source_type,
            "provenance": provenance,
        }
        return report

    def assemble_for_persistence(
        self,
        *,
        ai_response: AIResponseEnvelope,
        prompt_key: str,
    ) -> dict:
        """Build the data dict suitable for ResearchRepository.create.

        Separates the persistence-specific shape from the API shape
        so ResearchService stays thin.
        """
        return {
            "summary": ai_response.content[:500] if ai_response.content else None,
            "analysis": {
                "version": 1,
                "data": {
                    "fullContent": ai_response.content,
                    "promptKey": prompt_key,
                },
            },
            "prompt_key": prompt_key,
            "model_used": ai_response.model,
            "tokens_used": ai_response.usage.get("total_tokens", 0),
            "generation_time_ms": ai_response.duration_ms,
        }

    @staticmethod
    def _build_deterministic_data(company: Any, user: Any) -> dict[str, Any]:
        """Extract deterministic (non-AI) data from company and user."""
        return {
            "companyId": company.id,
            "companyName": company.name,
            "symbol": company.symbol,
            "sector": company.sector,
            "industry": company.industry,
            "currentPrice": float(company.current_price),
            "marketCap": company.market_cap,
            "userId": user.id,
            "experienceLevel": getattr(user, "experience_level", "beginner"),
            "riskPreference": getattr(user, "risk_preference", "moderate"),
        }

    @staticmethod
    def _build_ai_content(envelope: AIResponseEnvelope) -> dict[str, Any]:
        """Extract AI-generated content and metadata from the envelope."""
        return {
            "content": envelope.content,
            "promptKey": envelope.prompt_key,
            "promptVersion": envelope.prompt_version,
            "modelUsed": envelope.model,
            "tokensUsed": envelope.usage.get("total_tokens", 0),
            "generationTimeMs": envelope.duration_ms,
            "cached": envelope.cached,
            "sections": [
                {"title": s.title, "content": s.content, "order": s.order}
                for s in envelope.parsed_sections
            ],
        }

    @staticmethod
    def _build_provenance(
        envelope: AIResponseEnvelope, source_type: str
    ) -> dict[str, Any]:
        """Build provenance metadata for the research report."""
        return build_provenance(
            engine="research",
            prompt_key=envelope.prompt_key,
            provider=envelope.provider,
            model=envelope.model,
            correlation_id=envelope.correlation_id,
            prompt_version=envelope.prompt_version,
            extra={"sourceType": source_type},
        )