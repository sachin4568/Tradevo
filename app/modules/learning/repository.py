"""Learning domain data access layer.

LearningRepository: session CRUD and progress queries.
All repositories follow the constructor-injected AsyncSession pattern.
Transaction boundaries (commit/rollback) are managed at the service layer.
"""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.learning.models import LearningSession


class LearningRepository:
    """Data access for the LearningSession entity."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, session_id: str) -> LearningSession | None:
        """Fetch a learning session by primary key."""
        result = await self.db.execute(
            select(LearningSession).where(LearningSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_user(self, user_id: str) -> LearningSession | None:
        """Fetch the user's current ACTIVE session (at most one)."""
        result = await self.db.execute(
            select(LearningSession).where(
                LearningSession.user_id == user_id,
                LearningSession.status == "ACTIVE",
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[LearningSession]:
        """List sessions for a user, newest first."""
        result = await self.db.execute(
            select(LearningSession)
            .where(LearningSession.user_id == user_id)
            .order_by(LearningSession.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def create(
        self,
        session_id: str,
        user_id: str,
    ) -> LearningSession:
        """Create a new ACTIVE learning session."""
        now = datetime.now(UTC)
        session = LearningSession(
            id=session_id,
            user_id=user_id,
            status="ACTIVE",
            start_time=now,
            lesson_progress={"version": 1, "data": {}},
            companies_studied=[],
            simulated_trades_count=0,
            created_at=now,
            updated_at=now,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def end_session(
        self,
        session: LearningSession,
        *,
        improvement_summary: str | None = None,
        simulated_trades_count: int | None = None,
    ) -> LearningSession:
        """End an active learning session."""
        now = datetime.now(UTC)
        session.end_time = now
        session.status = "COMPLETED"
        session.updated_at = now
        if improvement_summary is not None:
            session.improvement_summary = improvement_summary
        if simulated_trades_count is not None:
            session.simulated_trades_count = simulated_trades_count
        await self.db.flush()
        return session

    async def update_lesson_progress(
        self,
        session: LearningSession,
        lesson_progress: dict,
    ) -> None:
        """Update the lesson progress JSON for a session."""
        session.lesson_progress = lesson_progress
        session.updated_at = datetime.now(UTC)
        await self.db.flush()

    async def add_company_studied(
        self,
        session: LearningSession,
        company_id: str,
    ) -> None:
        """Add a company ID to the companies_studied list (no duplicates)."""
        studied: list = list(session.companies_studied or [])
        if company_id not in studied:
            studied.append(company_id)
            session.companies_studied = studied
            session.updated_at = datetime.now(UTC)
            await self.db.flush()

    async def count_completed_by_user(self, user_id: str) -> int:
        """Count total completed sessions for a user."""
        result = await self.db.execute(
            select(func.count(LearningSession.id)).where(
                LearningSession.user_id == user_id,
                LearningSession.status == "COMPLETED",
            )
        )
        return result.scalar_one() or 0

    async def get_latest_completed_by_user(
        self, user_id: str
    ) -> LearningSession | None:
        """Fetch the most recently completed session for a user."""
        result = await self.db.execute(
            select(LearningSession)
            .where(
                LearningSession.user_id == user_id,
                LearningSession.status == "COMPLETED",
            )
            .order_by(LearningSession.end_time.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
