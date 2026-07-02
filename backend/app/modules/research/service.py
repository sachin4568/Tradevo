"""ResearchService — AI-powered company research.

Orchestrates the research pipeline:
1. Build context from company, portfolio, news, and decisions
2. Look up the prompt template from the registry
3. Call the LLM provider
4. Parse and persist the research report

The service is decoupled from specific LLM implementations via
the LLMProvider interface. The MockLLMProvider is used for development.
"""

import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    LLMServiceUnavailableError,
    NotFoundError,
)
from app.core.utils import generate_entity_id
from app.integrations.llm.base import GenerateConfig
from app.integrations.llm.factory import create_llm_provider
from app.integrations.news.factory import create_news_provider
from app.modules.ai.context.builder import AIContextBuilder
from app.modules.ai.prompt_registry import get_prompt
from app.modules.auth.models import User
from app.modules.market.repository import CompanyRepository, MarketRepository
from app.modules.portfolio.repository import HoldingRepository, PortfolioRepository
from app.modules.research.events import ResearchReportGenerated
from app.modules.research.models import ResearchReport
from app.modules.research.repository import ResearchRepository

logger = logging.getLogger(__name__)


class ResearchService:
    """AI-powered research report generation and retrieval."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = ResearchRepository(db)
        self.company_repo = CompanyRepository(db)
        self.portfolio_repo = PortfolioRepository(db)
        self.holding_repo = HoldingRepository(db)
        self.market_repo = MarketRepository(db)
        self.context_builder = AIContextBuilder()
        self._event_hooks: list = []

    def register_event_hook(self, hook) -> None:
        """Register a callback for research events."""
        self._event_hooks.append(hook)

    async def _emit_event(self, event) -> None:
        """Invoke registered event hooks (fire-and-forget)."""
        for hook in self._event_hooks:
            try:
                if callable(hook):
                    result = hook(event)
                    if hasattr(result, "__await__"):
                        await result
            except Exception:
                logger.exception("Event hook failed for event %s", event.event_type)

    async def generate_report(
        self,
        user_id: str,
        company_id: str,
        prompt_key: str = "research.company_analysis",
        source_type: str = "manual",
    ) -> dict:
        """Generate an AI research report for a company.

        Pipeline:
        1. Validate company exists
        2. Fetch user, portfolio, news, decisions
        3. Build AI context
        4. Render prompt from registry
        5. Call LLM provider
        6. Persist report
        7. Emit event

        Args:
            user_id: The requesting user's ID.
            company_id: The company to analyze.
            prompt_key: Prompt registry key (default: full analysis).
            source_type: 'manual', 'auto', or 'scheduled'.

        Returns:
            dict with the research report data.

        Raises:
            NotFoundError: If company not found.
            LLMServiceUnavailableError: If AI provider is not configured.
        """
        # Step 1: Validate company
        company = await self.company_repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")

        # Step 2: Fetch user (we need experience_level and risk_preference)
        # The user is fetched from the auth repo, but we receive it via API
        # We'll use a lightweight approach — fetch from the DB
        from app.modules.auth.repository import AuthRepository
        auth_repo = AuthRepository(self.repo.db)
        user = await auth_repo.get_by_id(user_id)

        # Step 3: Fetch related data for context
        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        holdings = []
        if portfolio:
            holding = await self.holding_repo.get_by_portfolio_and_company(
                portfolio.id, company_id
            )
            if holding:
                holdings = [holding]

        news = await self.market_repo.list_company_news(company_id, limit=5)

        # Step 4: Build context
        context = self.context_builder.build_company_research_context(
            company=company,
            user=user,
            holdings=holdings if holdings else None,
            news=news if news else None,
        )

        # Step 5: Get and render prompt
        try:
            template = get_prompt(prompt_key)
        except KeyError:
            raise NotFoundError(
                message=f"Prompt template '{prompt_key}' not found",
                error_code="PROMPT_NOT_FOUND",
            )

        rendered_prompt = template.render(context)

        # Step 6: Call LLM
        llm = create_llm_provider()
        if llm is None:
            raise LLMServiceUnavailableError()

        start_ms = int(time.monotonic() * 1000)
        settings = __import__("app.config", fromlist=["get_settings"]).get_settings()
        config = GenerateConfig(
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            model=settings.LLM_MODEL,
        )

        response = await llm.generate(rendered_prompt, context, config)
        elapsed_ms = int(time.monotonic() * 1000) - start_ms

        # Step 7: Persist report
        report = await self.repo.create(
            report_id=generate_entity_id("rpt"),
            user_id=user_id,
            company_id=company_id,
            source_type=source_type,
            summary=response.content[:500] if response.content else None,
            analysis={
                "version": 1,
                "data": {
                    "fullContent": response.content,
                    "promptKey": prompt_key,
                },
            },
            prompt_key=prompt_key,
            model_used=response.model,
            tokens_used=response.usage.get("total_tokens", 0),
            generation_time_ms=elapsed_ms,
        )

        # Emit event
        event = ResearchReportGenerated(
            report_id=report.id,
            user_id=user_id,
            company_id=company_id,
            prompt_key=prompt_key,
        )
        await self._emit_event(event)

        logger.info(
            "Research report generated: user=%s company=%s prompt=%s tokens=%d ms=%d",
            user_id,
            company_id,
            prompt_key,
            response.usage.get("total_tokens", 0),
            elapsed_ms,
        )

        return self._report_to_dict(report, company)

    async def get_report(self, user_id: str, report_id: str) -> dict:
        """Get a specific research report."""
        report = await self.repo.get_by_id(report_id)
        if report is None or report.user_id != user_id:
            raise NotFoundError(message="Research report not found")

        company = await self.company_repo.get_by_id(report.company_id)
        return self._report_to_dict(report, company)

    async def get_latest_report(
        self, user_id: str, company_id: str
    ) -> dict | None:
        """Get the latest report for a (user, company) pair.

        Returns None if no report exists (unlike get_report which raises).
        """
        report = await self.repo.get_latest_for_company(user_id, company_id)
        if report is None:
            return None

        company = await self.company_repo.get_by_id(report.company_id)
        return self._report_to_dict(report, company)

    async def list_reports(
        self,
        user_id: str,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """List research reports for a user with pagination."""
        reports = await self.repo.list_by_user(user_id, limit=limit, offset=offset)
        total = await self.repo.count_by_user(user_id)

        items = []
        for r in reports:
            company = await self.company_repo.get_by_id(r.company_id)
            items.append(self._report_to_dict(r, company))

        return {
            "reports": items,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    async def list_prompts(self) -> list[dict]:
        """List all available prompt templates."""
        from app.modules.ai.prompt_registry import list_prompts
        return list_prompts()

    @staticmethod
    def _report_to_dict(report: ResearchReport, company) -> dict:
        """Convert ResearchReport to camelCase dict for API response."""
        analysis_content = ""
        if report.analysis and isinstance(report.analysis, dict):
            analysis_content = report.analysis.get("data", {}).get("fullContent", "")

        return {
            "id": report.id,
            "userId": report.user_id,
            "companyId": report.company_id,
            "companyName": company.name if company else "",
            "symbol": company.symbol if company else "",
            "sector": company.sector if company else "",
            "sourceType": report.source_type,
            "summary": report.summary or "",
            "content": analysis_content,
            "promptKey": report.prompt_key or "",
            "modelUsed": report.model_used or "",
            "tokensUsed": report.tokens_used,
            "generationTimeMs": report.generation_time_ms,
            "createdAt": report.created_at.isoformat() if report.created_at else "",
            "updatedAt": report.updated_at.isoformat() if report.updated_at else "",
        }