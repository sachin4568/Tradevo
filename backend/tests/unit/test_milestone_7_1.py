"""Unit tests for Milestone 7.1 — Architecture Refinement.

Tests cover:
- Shared AI utilities (provenance, envelope_to_api_dict, merge_contexts)
- ResponseComposer (compose, compose_from_envelope)
- Engine contracts (typed request dataclasses)
- ResearchAssembler (assemble, assemble_for_persistence)
- Engine service integration (ResponseComposer injection)
"""

import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.ai.composer import ResponseComposer
from app.modules.ai.engines.contracts import (
    DNAEngineRequest,
    LearningGuidanceRequest,
    PortfolioObservationsRequest,
    PostLessonFeedbackRequest,
    PostTradeFeedbackRequest,
    ResearchEngineRequest,
    TradeReflectionRequest,
)
from app.modules.ai.schemas import (
    AIResponseEnvelope,
    ParsedSection,
    ValidationResult,
)
from app.modules.ai.utils.helpers import (
    build_provenance,
    current_timestamp_ms,
    envelope_to_api_dict,
    merge_contexts,
)


# ═══════════════════════════════════════════════════════════
# Shared Utilities
# ═══════════════════════════════════════════════════════════


class TestBuildProvenance:
    """Tests for build_provenance helper."""

    def test_basic_provenance(self):
        prov = build_provenance(
            engine="dna",
            prompt_key="dna.behaviour_analysis",
            provider="mock",
            model="test-model",
            correlation_id="ai-abc123",
        )
        assert prov["engine"] == "dna"
        assert prov["promptKey"] == "dna.behaviour_analysis"
        assert prov["provider"] == "mock"
        assert prov["model"] == "test-model"
        assert prov["correlationId"] == "ai-abc123"
        assert prov["promptVersion"] == 1
        assert "timestamp" in prov

    def test_provenance_with_extra(self):
        prov = build_provenance(
            engine="research",
            prompt_key="research.company_analysis",
            provider="openai",
            model="gpt-4",
            correlation_id="ai-xyz789",
            prompt_version=2,
            extra={"sourceType": "manual"},
        )
        assert prov["promptVersion"] == 2
        assert prov["sourceType"] == "manual"

    def test_provenance_timestamp_is_ms(self):
        before = int(time.time() * 1000)
        prov = build_provenance(
            engine="test",
            prompt_key="test.key",
            provider="mock",
            model="m",
            correlation_id="c",
        )
        after = int(time.time() * 1000)
        assert before <= prov["timestamp"] <= after


class TestCurrentTimestampMs:
    """Tests for current_timestamp_ms helper."""

    def test_returns_int(self):
        ts = current_timestamp_ms()
        assert isinstance(ts, int)

    def test_reasonable_range(self):
        ts = current_timestamp_ms()
        expected = int(time.time() * 1000)
        assert abs(ts - expected) < 1000  # within 1 second


class TestEnvelopeToApiDict:
    """Tests for envelope_to_api_dict helper."""

    def _make_envelope(self, **overrides):
        defaults = {
            "content": "Test AI content",
            "provider": "mock",
            "model": "test-model",
            "correlation_id": "ai-test123",
            "prompt_key": "test.prompt",
            "prompt_version": 1,
            "cached": False,
            "duration_ms": 100,
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
            "validation": ValidationResult(is_valid=True, errors=[], warnings=[]),
            "parsed_sections": [ParsedSection(title="S1", content="C1", order=1)],
            "metadata": {"engine": "test"},
        }
        defaults.update(overrides)
        return AIResponseEnvelope(**defaults)

    def test_basic_conversion(self):
        env = self._make_envelope()
        result = envelope_to_api_dict(env)
        assert result["content"] == "Test AI content"
        assert result["provider"] == "mock"
        assert result["model"] == "test-model"
        assert result["correlationId"] == "ai-test123"
        assert result["promptKey"] == "test.prompt"
        assert result["promptVersion"] == 1
        assert result["cached"] is False
        assert result["durationMs"] == 100
        assert result["usage"]["total_tokens"] == 30

    def test_validation_converted(self):
        env = self._make_envelope(
            validation=ValidationResult(
                is_valid=True, warnings=["minor"], errors=[]
            )
        )
        result = envelope_to_api_dict(env)
        assert result["validation"]["isValid"] is True
        assert result["validation"]["warnings"] == ["minor"]
        assert result["validation"]["errors"] == []

    def test_sections_converted(self):
        env = self._make_envelope(
            parsed_sections=[
                ParsedSection(title="Overview", content="Text", order=0),
                ParsedSection(title="Risk", content="High", order=1),
            ]
        )
        result = envelope_to_api_dict(env)
        assert len(result["sections"]) == 2
        assert result["sections"][0]["title"] == "Overview"
        assert result["sections"][1]["order"] == 1

    def test_provenance_included(self):
        env = self._make_envelope()
        result = envelope_to_api_dict(env)
        assert "provenance" in result
        assert result["provenance"]["engine"] == "test"
        assert result["provenance"]["provider"] == "mock"


class TestMergeContexts:
    """Tests for merge_contexts helper."""

    def test_merge_two_dicts(self):
        result = merge_contexts({"a": 1}, {"b": 2})
        assert result == {"a": 1, "b": 2}

    def test_later_overrides_earlier(self):
        result = merge_contexts({"a": 1, "b": 2}, {"b": 3})
        assert result == {"a": 1, "b": 3}

    def test_skips_none(self):
        result = merge_contexts({"a": 1}, None, {"b": 2})
        assert result == {"a": 1, "b": 2}

    def test_empty_input(self):
        result = merge_contexts()
        assert result == {}

    def test_three_way_merge(self):
        result = merge_contexts({"x": 1}, {"y": 2}, {"z": 3})
        assert result == {"x": 1, "y": 2, "z": 3}


# ═══════════════════════════════════════════════════════════
# ResponseComposer
# ═══════════════════════════════════════════════════════════


class TestResponseComposer:
    """Tests for ResponseComposer."""

    def test_compose_basic(self):
        comp = ResponseComposer(engine="dna")
        env = comp.compose(
            content="Generated text",
            provider="mock",
            model="test",
            correlation_id="c1",
            prompt_key="dna.behaviour_analysis",
        )
        assert env.content == "Generated text"
        assert env.provider == "mock"
        assert env.model == "test"
        assert env.correlation_id == "c1"
        assert env.prompt_key == "dna.behaviour_analysis"
        assert env.metadata["engine"] == "dna"
        assert "provenance" in env.metadata

    def test_compose_with_all_params(self):
        comp = ResponseComposer(engine="research")
        validation = ValidationResult(is_valid=True, warnings=["w1"], errors=[])
        sections = [ParsedSection(title="T", content="C", order=0)]
        env = comp.compose(
            content="Text",
            provider="openai",
            model="gpt-4",
            correlation_id="c2",
            prompt_key="research.company_analysis",
            prompt_version=2,
            parsed_sections=sections,
            validation=validation,
            usage={"prompt_tokens": 5, "completion_tokens": 10, "total_tokens": 15},
            cached=True,
            duration_ms=500,
            extra_metadata={"sourceType": "auto"},
        )
        assert env.cached is True
        assert env.duration_ms == 500
        assert len(env.parsed_sections) == 1
        assert env.validation.warnings == ["w1"]
        assert env.metadata["sourceType"] == "auto"
        assert env.metadata["engine"] == "research"

    def test_compose_defaults_validation(self):
        comp = ResponseComposer(engine="test")
        env = comp.compose(
            content="T",
            provider="p",
            model="m",
            correlation_id="c",
            prompt_key="k",
        )
        assert env.validation.is_valid is True
        assert env.validation.errors == []
        assert env.validation.warnings == []

    def test_compose_defaults_usage(self):
        comp = ResponseComposer(engine="test")
        env = comp.compose(
            content="T",
            provider="p",
            model="m",
            correlation_id="c",
            prompt_key="k",
        )
        assert env.usage["prompt_tokens"] == 0
        assert env.usage["completion_tokens"] == 0
        assert env.usage["total_tokens"] == 0

    def test_compose_from_envelope_injects_provenance(self):
        comp = ResponseComposer(engine="feedback")
        original = AIResponseEnvelope(
            content="Feedback text",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="feedback.post_trade",
            metadata={},
        )
        result = comp.compose_from_envelope(original)
        assert result.content == "Feedback text"
        assert result.metadata["engine"] == "feedback"
        assert result.metadata["provenance"]["engine"] == "feedback"
        assert result.metadata["provenance"]["promptKey"] == "feedback.post_trade"

    def test_compose_from_envelope_preserves_all_fields(self):
        comp = ResponseComposer(engine="learning")
        validation = ValidationResult(is_valid=False, errors=["e1"], warnings=[])
        original = AIResponseEnvelope(
            content="Guidance",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="learning.guidance",
            cached=True,
            duration_ms=200,
            validation=validation,
            usage={"total_tokens": 50},
        )
        result = comp.compose_from_envelope(original)
        assert result.cached is True
        assert result.duration_ms == 200
        assert result.validation.is_valid is False
        assert result.usage["total_tokens"] == 50

    def test_compose_from_envelope_extra_metadata(self):
        comp = ResponseComposer(engine="test")
        original = AIResponseEnvelope(
            content="T",
            provider="p",
            model="m",
            correlation_id="c",
            prompt_key="k",
            metadata={"existing": "val"},
        )
        result = comp.compose_from_envelope(
            original, extra_metadata={"added": "val2"}
        )
        assert result.metadata["existing"] == "val"
        assert result.metadata["added"] == "val2"

    def test_compose_provenance_has_all_fields(self):
        comp = ResponseComposer(engine="test")
        env = comp.compose(
            content="T",
            provider="p",
            model="m",
            correlation_id="c",
            prompt_key="k",
            prompt_version=3,
        )
        prov = env.metadata["provenance"]
        assert prov["engine"] == "test"
        assert prov["promptKey"] == "k"
        assert prov["provider"] == "p"
        assert prov["model"] == "m"
        assert prov["correlationId"] == "c"
        assert prov["promptVersion"] == 3
        assert "timestamp" in prov


# ═══════════════════════════════════════════════════════════
# Engine Contracts
# ═══════════════════════════════════════════════════════════


class TestEngineContracts:
    """Tests for typed engine request contracts."""

    def test_research_engine_request_defaults(self):
        req = ResearchEngineRequest()
        assert req.prompt_key == "research.company_analysis"
        assert req.context == {}

    def test_research_engine_request_custom(self):
        req = ResearchEngineRequest(
            prompt_key="research.quick_summary",
            context={"company_name": "Reliance"},
        )
        assert req.prompt_key == "research.quick_summary"
        assert req.context["company_name"] == "Reliance"

    def test_dna_engine_request_defaults(self):
        req = DNAEngineRequest()
        assert req.user is None
        assert req.holdings == []
        assert req.transactions == []
        assert req.companies_by_id is None

    def test_portfolio_observations_request(self):
        req = PortfolioObservationsRequest()
        assert req.portfolio is None
        assert req.holdings == []

    def test_trade_reflection_request(self):
        req = TradeReflectionRequest()
        assert req.transaction is None
        assert req.company is None

    def test_learning_guidance_request(self):
        req = LearningGuidanceRequest()
        assert req.learning_sessions == []
        assert req.decisions == []

    def test_post_trade_feedback_request(self):
        req = PostTradeFeedbackRequest(holding_count=5, sector_count=3)
        assert req.holding_count == 5
        assert req.sector_count == 3

    def test_post_lesson_feedback_request(self):
        req = PostLessonFeedbackRequest(
            lesson_id="l1", module_id="m1", total_trades=10
        )
        assert req.lesson_id == "l1"
        assert req.module_id == "m1"
        assert req.total_trades == 10


# ═══════════════════════════════════════════════════════════
# ResearchAssembler
# ═══════════════════════════════════════════════════════════


class TestResearchAssembler:
    """Tests for ResearchAssembler."""

    def _make_company(self):
        c = MagicMock()
        c.id = "comp-1"
        c.name = "Reliance Industries"
        c.symbol = "RELIANCE"
        c.sector = "Energy"
        c.industry = "Oil & Gas"
        c.current_price = 2500.0
        c.market_cap = "Large Cap"
        return c

    def _make_user(self):
        u = MagicMock()
        u.id = "usr-1"
        u.experience_level = "intermediate"
        u.risk_preference = "moderate"
        return u

    def _make_envelope(self):
        return AIResponseEnvelope(
            content="Full analysis content here.",
            provider="mock",
            model="test-model",
            correlation_id="ai-rpt123",
            prompt_key="research.company_analysis",
            prompt_version=1,
            parsed_sections=[
                ParsedSection(title="Overview", content="Company overview", order=0),
                ParsedSection(title="Risks", content="Key risks", order=1),
            ],
            validation=ValidationResult(is_valid=True),
            usage={"prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300},
            cached=False,
            duration_ms=1500,
        )

    def test_assemble_basic(self):
        from app.modules.research.assembler import ResearchAssembler

        assembler = ResearchAssembler()
        company = self._make_company()
        user = self._make_user()
        envelope = self._make_envelope()

        result = assembler.assemble(
            company=company,
            user=user,
            ai_response=envelope,
            source_type="manual",
        )

        # Deterministic data
        assert result["companyId"] == "comp-1"
        assert result["companyName"] == "Reliance Industries"
        assert result["symbol"] == "RELIANCE"
        assert result["sector"] == "Energy"
        assert result["userId"] == "usr-1"

        # AI content
        assert result["content"] == "Full analysis content here."
        assert result["modelUsed"] == "test-model"
        assert result["tokensUsed"] == 300
        assert result["generationTimeMs"] == 1500
        assert result["cached"] is False
        assert len(result["sections"]) == 2

        # Provenance
        assert result["provenance"]["engine"] == "research"
        assert result["provenance"]["provider"] == "mock"
        assert result["provenance"]["correlationId"] == "ai-rpt123"
        assert result["sourceType"] == "manual"

    def test_assemble_for_persistence(self):
        from app.modules.research.assembler import ResearchAssembler

        assembler = ResearchAssembler()
        envelope = self._make_envelope()

        result = assembler.assemble_for_persistence(
            ai_response=envelope,
            prompt_key="research.company_analysis",
        )

        assert result["summary"] == "Full analysis content here."
        assert result["analysis"]["version"] == 1
        assert result["analysis"]["data"]["fullContent"] == "Full analysis content here."
        assert result["analysis"]["data"]["promptKey"] == "research.company_analysis"
        assert result["prompt_key"] == "research.company_analysis"
        assert result["model_used"] == "test-model"
        assert result["tokens_used"] == 300
        assert result["generation_time_ms"] == 1500

    def test_assemble_for_persistence_long_content(self):
        from app.modules.research.assembler import ResearchAssembler

        assembler = ResearchAssembler()
        envelope = AIResponseEnvelope(
            content="X" * 600,
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="k",
        )

        result = assembler.assemble_for_persistence(
            ai_response=envelope,
            prompt_key="k",
        )
        assert len(result["summary"]) == 500


# ═══════════════════════════════════════════════════════════
# Engine Service Integration (ResponseComposer)
# ═══════════════════════════════════════════════════════════


class TestEngineResponseComposerIntegration:
    """Verify engines inject provenance via ResponseComposer."""

    def test_ai_research_service_has_composer(self):
        from app.modules.ai.engines.services import AIResearchService

        rm = MagicMock()
        svc = AIResearchService(rm)
        assert hasattr(svc, '_composer')
        assert svc._composer._engine == "research"

    def test_dna_service_has_composer(self):
        from app.modules.ai.engines.services import InvestmentDNAService

        rm = MagicMock()
        svc = InvestmentDNAService(rm)
        assert svc._composer._engine == "dna"

    def test_decision_service_has_composer(self):
        from app.modules.ai.engines.services import DecisionIntelligenceService

        rm = MagicMock()
        svc = DecisionIntelligenceService(rm)
        assert svc._composer._engine == "decision"

    def test_learning_service_has_composer(self):
        from app.modules.ai.engines.services import LearningIntelligenceService

        rm = MagicMock()
        svc = LearningIntelligenceService(rm)
        assert svc._composer._engine == "learning"

    def test_feedback_service_has_composer(self):
        from app.modules.ai.engines.services import RuntimeFeedbackService

        svc = RuntimeFeedbackService(request_manager=MagicMock())
        assert svc._composer._engine == "feedback"

    def test_feedback_service_none_rm_no_composer_error(self):
        from app.modules.ai.engines.services import RuntimeFeedbackService

        svc = RuntimeFeedbackService(request_manager=None)
        assert svc._rm is None
        # Composer still exists even without RM
        assert hasattr(svc, '_composer')

    @pytest.mark.asyncio
    async def test_ai_research_compose_from_envelope(self):
        from app.modules.ai.engines.services import AIResearchService

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="Analysis",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="research.company_analysis",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        svc = AIResearchService(rm)
        result = await svc.generate(
            prompt_key="research.company_analysis",
            context={"company_name": "Test"},
        )

        assert result is not None
        assert result.metadata["engine"] == "research"
        assert "provenance" in result.metadata

    @pytest.mark.asyncio
    async def test_dna_compose_from_envelope(self):
        from app.modules.ai.engines.services import InvestmentDNAService

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="DNA",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="dna.behaviour_analysis",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        svc = InvestmentDNAService(rm)
        result = await svc.analyse_behaviour(
            user=MagicMock(),
            portfolio=MagicMock(),
            holdings=[],
            transactions=[],
        )

        assert result is not None
        assert result.metadata["engine"] == "dna"

    @pytest.mark.asyncio
    async def test_feedback_none_rm_returns_none(self):
        from app.modules.ai.engines.services import RuntimeFeedbackService

        svc = RuntimeFeedbackService(request_manager=None)
        result = await svc.post_trade_feedback(
            user=MagicMock(),
            transaction=MagicMock(),
            company=MagicMock(),
            holding_count=1,
            sector_count=1,
            remaining_cash=1000.0,
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_dna_execute_typed_contract(self):
        from app.modules.ai.engines.services import InvestmentDNAService
        from app.modules.ai.engines.contracts import DNAEngineRequest

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="DNA",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="dna.behaviour_analysis",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        svc = InvestmentDNAService(rm)
        req = DNAEngineRequest(user=MagicMock(), portfolio=MagicMock())
        result = await svc.execute(req)
        assert result is not None
        assert result.metadata["engine"] == "dna"

    @pytest.mark.asyncio
    async def test_portfolio_observations_execute_typed(self):
        from app.modules.ai.engines.services import DecisionIntelligenceService
        from app.modules.ai.engines.contracts import PortfolioObservationsRequest

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="Obs",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="decision.portfolio_observations",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        mock_portfolio = MagicMock()
        mock_portfolio.virtual_cash = 10000.0
        mock_portfolio.total_invested = 50000.0

        svc = DecisionIntelligenceService(rm)
        req = PortfolioObservationsRequest(
            portfolio=mock_portfolio,
            holdings=[],
            transactions=[],
        )
        result = await svc.execute_portfolio_observations(req)
        assert result is not None
        assert result.metadata["engine"] == "decision"

    @pytest.mark.asyncio
    async def test_trade_reflection_execute_typed(self):
        from app.modules.ai.engines.services import DecisionIntelligenceService
        from app.modules.ai.engines.contracts import TradeReflectionRequest

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="Reflection",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="decision.trade_reflection",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        mock_txn = MagicMock()
        mock_txn.transaction_type = "BUY"
        mock_txn.quantity = 10
        mock_txn.price = 500.0
        mock_txn.total = 5000.0
        mock_company = MagicMock()
        mock_company.name = "Reliance"
        mock_company.symbol = "RELIANCE"
        mock_company.sector = "Energy"
        mock_portfolio = MagicMock()
        mock_portfolio.virtual_cash = 5000.0

        svc = DecisionIntelligenceService(rm)
        req = TradeReflectionRequest(
            transaction=mock_txn,
            company=mock_company,
            holdings=[],
            portfolio=mock_portfolio,
        )
        result = await svc.execute_trade_reflection(req)
        assert result is not None

    @pytest.mark.asyncio
    async def test_learning_execute_typed(self):
        from app.modules.ai.engines.services import LearningIntelligenceService
        from app.modules.ai.engines.contracts import LearningGuidanceRequest

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="Guidance",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="learning.guidance",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        svc = LearningIntelligenceService(rm)
        req = LearningGuidanceRequest()
        result = await svc.execute(req)
        assert result is not None
        assert result.metadata["engine"] == "learning"

    @pytest.mark.asyncio
    async def test_post_trade_execute_typed(self):
        from app.modules.ai.engines.services import RuntimeFeedbackService
        from app.modules.ai.engines.contracts import PostTradeFeedbackRequest

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="Feedback",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="feedback.post_trade",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        svc = RuntimeFeedbackService(rm)
        mock_txn = MagicMock()
        mock_txn.transaction_type = "BUY"
        mock_txn.quantity = 10
        mock_txn.price = 500.0
        mock_company = MagicMock()
        mock_company.name = "Reliance"
        mock_company.symbol = "RELIANCE"
        mock_user = MagicMock()
        req = PostTradeFeedbackRequest(
            user=mock_user,
            transaction=mock_txn,
            company=mock_company,
            holding_count=5,
            sector_count=3,
            remaining_cash=10000.0,
        )
        result = await svc.execute_post_trade(req)
        assert result is not None
        assert result.metadata["engine"] == "feedback"

    @pytest.mark.asyncio
    async def test_post_lesson_execute_typed(self):
        from app.modules.ai.engines.services import RuntimeFeedbackService
        from app.modules.ai.engines.contracts import PostLessonFeedbackRequest

        rm = MagicMock()
        envelope = AIResponseEnvelope(
            content="Lesson feedback",
            provider="mock",
            model="m",
            correlation_id="c",
            prompt_key="feedback.post_lesson",
            metadata={},
        )
        rm.generate = AsyncMock(return_value=envelope)

        svc = RuntimeFeedbackService(rm)
        req = PostLessonFeedbackRequest(lesson_id="l1", module_id="m1")
        result = await svc.execute_post_lesson(req)
        assert result is not None
        assert result.metadata["engine"] == "feedback"

    @pytest.mark.asyncio
    async def test_engine_failure_returns_none(self):
        from app.modules.ai.engines.services import InvestmentDNAService

        rm = MagicMock()
        rm.generate = AsyncMock(side_effect=RuntimeError("AI down"))

        svc = InvestmentDNAService(rm)
        result = await svc.analyse_behaviour(
            user=MagicMock(),
            portfolio=MagicMock(),
            holdings=[],
            transactions=[],
        )
        assert result is None