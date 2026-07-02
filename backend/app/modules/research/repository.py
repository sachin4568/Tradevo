"""Research domain data access layer.

ResearchRepository: CRUD operations for research reports.
Follows the constructor-injected AsyncSession pattern.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.research.models import ResearchReport


class ResearchRepository:
    """Data access for the ResearchReport entity."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, report_id: str) -> ResearchReport | None:
        """Fetch a research report by primary key."""
        result = await self.db.execute(
            select(ResearchReport).where(ResearchReport.id == report_id)
        )
        return result.scalar_one_or_none()

    async def get_latest_for_company(
        self, user_id: str, company_id: str
    ) -> ResearchReport | None:
        """Fetch the most recent report for a (user, company) pair."""
        result = await self.db.execute(
            select(ResearchReport)
            .where(
                ResearchReport.user_id == user_id,
                ResearchReport.company_id == company_id,
            )
            .order_by(ResearchReport.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: str,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ResearchReport]:
        """List research reports for a user, newest first."""
        result = await self.db.execute(
            select(ResearchReport)
            .where(ResearchReport.user_id == user_id)
            .order_by(ResearchReport.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def list_by_company(
        self,
        user_id: str,
        company_id: str,
        *,
        limit: int = 10,
    ) -> list[ResearchReport]:
        """List research reports for a specific company, newest first."""
        result = await self.db.execute(
            select(ResearchReport)
            .where(
                ResearchReport.user_id == user_id,
                ResearchReport.company_id == company_id,
            )
            .order_by(ResearchReport.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(
        self,
        report_id: str,
        user_id: str,
        company_id: str,
        *,
        source_type: str = "manual",
        summary: str | None = None,
        analysis: dict | None = None,
        prompt_key: str | None = None,
        model_used: str | None = None,
        tokens_used: int = 0,
        generation_time_ms: int = 0,
    ) -> ResearchReport:
        """Create a new research report."""
        now = datetime.now(UTC)
        report = ResearchReport(
            id=report_id,
            user_id=user_id,
            company_id=company_id,
            source_type=source_type,
            summary=summary,
            analysis=analysis,
            prompt_key=prompt_key,
            model_used=model_used,
            tokens_used=tokens_used,
            generation_time_ms=generation_time_ms,
            created_at=now,
            updated_at=now,
        )
        self.db.add(report)
        await self.db.flush()
        return report

    async def count_by_user(self, user_id: str) -> int:
        """Count total research reports for a user."""
        from sqlalchemy import func

        result = await self.db.execute(
            select(func.count(ResearchReport.id)).where(
                ResearchReport.user_id == user_id
            )
        )
        return result.scalar_one() or 0