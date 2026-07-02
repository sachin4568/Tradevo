"""AI Engines — user-facing AI capabilities (Milestone 7, refined in 7.1).

Each engine service follows the architecture rule:
  Business Module → AI Engine → AIRequestManager → Context Builder → Prompt Registry
               → Provider → Parser → Validator → ResponseComposer → API Response

Contract discipline:
- Every engine accepts a typed request object (from contracts.py)
- Every engine returns AIResponseEnvelope | None
- Every engine uses ResponseComposer for envelope metadata
- No engine ever calls a provider directly
- No engine manually constructs response envelopes
- AI failures are caught gracefully so the application continues normally
"""

import logging
from typing import Any

from app.modules.ai.composer import ResponseComposer
from app.modules.ai.context.builder import AIContextBuilder
from app.modules.ai.engines.contracts import (
    DNAEngineRequest,
    LearningGuidanceRequest,
    PortfolioObservationsRequest,
    PostLessonFeedbackRequest,
    PostTradeFeedbackRequest,
    ResearchEngineRequest,
    TradeReflectionRequest,
)
from app.modules.ai.provider_factory import create_provider_manager
from app.modules.ai.request_manager import AIRequestManager
from app.modules.ai.schemas import AIResponseEnvelope

logger = logging.getLogger(__name__)


def _get_request_manager() -> AIRequestManager | None:
    """Create an AIRequestManager from config.

    Returns None if provider setup fails, allowing graceful degradation.
    """
    try:
        pm = create_provider_manager()
        if pm.provider_count == 0:
            return None
        return AIRequestManager(pm)
    except Exception:
        logger.exception("Failed to create AI request manager")
        return None


class AIResearchService:
    """AI-powered research routed through AIRequestManager.

    Replaces the direct LLM calls in ResearchService with the
    AI Execution Platform pipeline.
    """

    ENGINE_NAME = "research"

    def __init__(self, request_manager: AIRequestManager) -> None:
        self._rm = request_manager
        self._builder = AIContextBuilder()
        self._composer = ResponseComposer(engine=self.ENGINE_NAME)

    async def generate(
        self,
        *,
        prompt_key: str,
        context: dict[str, Any],
    ) -> AIResponseEnvelope | None:
        """Generate research content via the AI platform.

        Accepts a ResearchEngineRequest contract via keyword args
        for backward compatibility with existing callers.
        """
        try:
            envelope = await self._rm.generate(prompt_key, context)
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("AIResearchService generation failed")
            return None

    async def execute(self, request: ResearchEngineRequest) -> AIResponseEnvelope | None:
        """Typed-contract entry point for research generation."""
        return await self.generate(
            prompt_key=request.prompt_key,
            context=request.context,
        )


class InvestmentDNAService:
    """Analyses investing behaviour patterns.

    Returns descriptive observations only.
    No numeric scores. No recommendations.
    """

    ENGINE_NAME = "dna"

    def __init__(self, request_manager: AIRequestManager) -> None:
        self._rm = request_manager
        self._builder = AIContextBuilder()
        self._composer = ResponseComposer(engine=self.ENGINE_NAME)

    async def analyse_behaviour(
        self,
        *,
        user: Any,
        portfolio: Any,
        holdings: list[Any],
        transactions: list[Any],
        companies_by_id: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope | None:
        """Analyse investing behaviour patterns (keyword args, backward compat)."""
        context = self._builder.build_dna_context(
            user=user,
            holdings=holdings,
            transactions=transactions,
            portfolio=portfolio,
            companies_by_id=companies_by_id,
        )
        try:
            envelope = await self._rm.generate("dna.behaviour_analysis", context)
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("InvestmentDNAService analyse_behaviour failed")
            return None

    async def execute(self, request: DNAEngineRequest) -> AIResponseEnvelope | None:
        """Typed-contract entry point for DNA analysis."""
        return await self.analyse_behaviour(
            user=request.user,
            portfolio=request.portfolio,
            holdings=request.holdings,
            transactions=request.transactions,
            companies_by_id=request.companies_by_id,
        )


class DecisionIntelligenceService:
    """Generates portfolio and trade observations.

    Never generates BUY or SELL recommendations.
    Only explains portfolio characteristics.
    """

    ENGINE_NAME = "decision"

    def __init__(self, request_manager: AIRequestManager) -> None:
        self._rm = request_manager
        self._builder = AIContextBuilder()
        self._composer = ResponseComposer(engine=self.ENGINE_NAME)

    async def get_portfolio_observations(
        self,
        *,
        portfolio: Any,
        holdings: list[Any],
        transactions: list[Any],
        companies_by_id: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope | None:
        """Generate portfolio observations (keyword args, backward compat)."""
        context = self._builder.build_portfolio_observations_context(
            holdings=holdings,
            transactions=transactions,
            portfolio=portfolio,
            companies_by_id=companies_by_id,
        )
        try:
            envelope = await self._rm.generate(
                "decision.portfolio_observations", context
            )
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("DecisionIntelligenceService portfolio observations failed")
            return None

    async def execute_portfolio_observations(
        self, request: PortfolioObservationsRequest
    ) -> AIResponseEnvelope | None:
        """Typed-contract entry point for portfolio observations."""
        return await self.get_portfolio_observations(
            portfolio=request.portfolio,
            holdings=request.holdings,
            transactions=request.transactions,
            companies_by_id=request.companies_by_id,
        )

    async def get_trade_reflection(
        self,
        *,
        transaction: Any,
        company: Any,
        holdings: list[Any],
        portfolio: Any,
    ) -> AIResponseEnvelope | None:
        """Generate educational trade reflection (keyword args, backward compat)."""
        context = self._builder.build_trade_reflection_context(
            transaction=transaction,
            company=company,
            holdings=holdings,
            portfolio=portfolio,
        )
        try:
            envelope = await self._rm.generate("decision.trade_reflection", context)
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("DecisionIntelligenceService trade reflection failed")
            return None

    async def execute_trade_reflection(
        self, request: TradeReflectionRequest
    ) -> AIResponseEnvelope | None:
        """Typed-contract entry point for trade reflection."""
        return await self.get_trade_reflection(
            transaction=request.transaction,
            company=request.company,
            holdings=request.holdings,
            portfolio=request.portfolio,
        )


class LearningIntelligenceService:
    """Generates contextual learning guidance.

    Connects learning sessions, decisions, and portfolio activity.
    Never evaluates or grades the user.
    """

    ENGINE_NAME = "learning"

    def __init__(self, request_manager: AIRequestManager) -> None:
        self._rm = request_manager
        self._builder = AIContextBuilder()
        self._composer = ResponseComposer(engine=self.ENGINE_NAME)

    async def get_guidance(
        self,
        *,
        user: Any,
        learning_sessions: list[Any],
        decisions: list[Any],
        holdings: list[Any],
        companies_by_id: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope | None:
        """Generate learning guidance (keyword args, backward compat)."""
        context = self._builder.build_learning_guidance_context(
            user=user,
            learning_sessions=learning_sessions,
            decisions=decisions,
            holdings=holdings,
            companies_by_id=companies_by_id,
        )
        try:
            envelope = await self._rm.generate("learning.guidance", context)
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("LearningIntelligenceService guidance failed")
            return None

    async def execute(self, request: LearningGuidanceRequest) -> AIResponseEnvelope | None:
        """Typed-contract entry point for learning guidance."""
        return await self.get_guidance(
            user=request.user,
            learning_sessions=request.learning_sessions,
            decisions=request.decisions,
            holdings=request.holdings,
            companies_by_id=request.companies_by_id,
        )


class RuntimeFeedbackService:
    """Generates short educational feedback after trades and lessons.

    Feedback is optional. If AI is unavailable, the application
    continues normally — this service always returns safely.
    """

    ENGINE_NAME = "feedback"

    def __init__(self, request_manager: AIRequestManager | None = None) -> None:
        self._rm = request_manager
        self._builder = AIContextBuilder()
        self._composer = ResponseComposer(engine=self.ENGINE_NAME)

    async def post_trade_feedback(
        self,
        *,
        user: Any,
        transaction: Any,
        company: Any,
        holding_count: int,
        sector_count: int,
        remaining_cash: float,
    ) -> AIResponseEnvelope | None:
        """Generate short educational feedback after a trade (backward compat)."""
        if self._rm is None:
            return None
        context = self._builder.build_post_trade_feedback_context(
            user=user,
            transaction=transaction,
            company=company,
            holding_count=holding_count,
            sector_count=sector_count,
            remaining_cash=remaining_cash,
        )
        try:
            envelope = await self._rm.generate("feedback.post_trade", context)
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("RuntimeFeedbackService post_trade failed")
            return None

    async def execute_post_trade(
        self, request: PostTradeFeedbackRequest
    ) -> AIResponseEnvelope | None:
        """Typed-contract entry point for post-trade feedback."""
        return await self.post_trade_feedback(
            user=request.user,
            transaction=request.transaction,
            company=request.company,
            holding_count=request.holding_count,
            sector_count=request.sector_count,
            remaining_cash=request.remaining_cash,
        )

    async def post_lesson_feedback(
        self,
        *,
        user: Any,
        lesson_id: str,
        module_id: str,
        total_trades: int,
        holding_count: int,
    ) -> AIResponseEnvelope | None:
        """Generate short educational feedback after a lesson (backward compat)."""
        if self._rm is None:
            return None
        context = self._builder.build_post_lesson_feedback_context(
            user=user,
            lesson_id=lesson_id,
            module_id=module_id,
            total_trades=total_trades,
            holding_count=holding_count,
        )
        try:
            envelope = await self._rm.generate("feedback.post_lesson", context)
            return self._composer.compose_from_envelope(envelope)
        except Exception:
            logger.exception("RuntimeFeedbackService post_lesson failed")
            return None

    async def execute_post_lesson(
        self, request: PostLessonFeedbackRequest
    ) -> AIResponseEnvelope | None:
        """Typed-contract entry point for post-lesson feedback."""
        return await self.post_lesson_feedback(
            user=request.user,
            lesson_id=request.lesson_id,
            module_id=request.module_id,
            total_trades=request.total_trades,
            holding_count=request.holding_count,
        )