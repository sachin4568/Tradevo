"""Typed request/response contracts for AI engines.

Every AI engine must accept a typed request object and return a
typed response object.  Provider-specific structures are never
exposed outside the AI layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# ─── Research Engine ───


@dataclass
class ResearchEngineRequest:
    """Typed request for AIResearchService."""

    prompt_key: str = "research.company_analysis"
    context: dict[str, Any] = field(default_factory=dict)


# ─── Investment DNA Engine ───


@dataclass
class DNAEngineRequest:
    """Typed request for InvestmentDNAService."""

    user: Any = None
    portfolio: Any = None
    holdings: list[Any] = field(default_factory=list)
    transactions: list[Any] = field(default_factory=list)
    companies_by_id: dict[str, Any] | None = None


# ─── Decision Intelligence Engine ───


@dataclass
class PortfolioObservationsRequest:
    """Typed request for DecisionIntelligenceService.get_portfolio_observations."""

    portfolio: Any = None
    holdings: list[Any] = field(default_factory=list)
    transactions: list[Any] = field(default_factory=list)
    companies_by_id: dict[str, Any] | None = None


@dataclass
class TradeReflectionRequest:
    """Typed request for DecisionIntelligenceService.get_trade_reflection."""

    transaction: Any = None
    company: Any = None
    holdings: list[Any] = field(default_factory=list)
    portfolio: Any = None


# ─── Learning Intelligence Engine ───


@dataclass
class LearningGuidanceRequest:
    """Typed request for LearningIntelligenceService.get_guidance."""

    user: Any = None
    learning_sessions: list[Any] = field(default_factory=list)
    decisions: list[Any] = field(default_factory=list)
    holdings: list[Any] = field(default_factory=list)
    companies_by_id: dict[str, Any] | None = None


# ─── Runtime Feedback Engine ───


@dataclass
class PostTradeFeedbackRequest:
    """Typed request for RuntimeFeedbackService.post_trade_feedback."""

    user: Any = None
    transaction: Any = None
    company: Any = None
    holding_count: int = 0
    sector_count: int = 0
    remaining_cash: float = 0.0


@dataclass
class PostLessonFeedbackRequest:
    """Typed request for RuntimeFeedbackService.post_lesson_feedback."""

    user: Any = None
    lesson_id: str = ""
    module_id: str = ""
    total_trades: int = 0
    holding_count: int = 0
