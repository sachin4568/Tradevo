"""DecisionTimeline data access layer.

DecisionTimelineRepository: creation and query operations for
the AI module's DecisionTimeline entity.

The portfolio and learning modules never import this repository.
It is used only by the event subscriber and future AI services.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.models import DecisionTimeline


class DecisionTimelineRepository:
    """Data access for the DecisionTimeline entity."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        timeline_id: str,
        user_id: str,
        company_id: str,
        decision_type: str,
        user_action: str,
        *,
        transaction_id: str | None = None,
    ) -> DecisionTimeline:
        """Create a new DecisionTimeline entry."""
        timeline = DecisionTimeline(
            id=timeline_id,
            user_id=user_id,
            company_id=company_id,
            decision_type=decision_type,
            user_action=user_action,
            transaction_id=transaction_id,
        )
        self.db.add(timeline)
        await self.db.flush()
        return timeline

    async def list_by_user(
        self,
        user_id: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[DecisionTimeline]:
        """List decision timeline entries for a user, newest first."""
        result = await self.db.execute(
            select(DecisionTimeline)
            .where(DecisionTimeline.user_id == user_id)
            .order_by(DecisionTimeline.decision_time.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_by_transaction(
        self, transaction_id: str
    ) -> DecisionTimeline | None:
        """Fetch a decision timeline entry by transaction ID."""
        result = await self.db.execute(
            select(DecisionTimeline).where(
                DecisionTimeline.transaction_id == transaction_id
            )
        )
        return result.scalar_one_or_none()
