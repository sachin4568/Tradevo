"""Watchlist domain data access layer.

WatchlistRepository: CRUD operations for watchlist items.
Follows the constructor-injected AsyncSession pattern.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.watchlist.models import WatchlistItem


class WatchlistRepository:
    """Data access for the WatchlistItem entity."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_user(self, user_id: str) -> list[WatchlistItem]:
        """List all watchlist items for a user, newest first."""
        result = await self.db.execute(
            select(WatchlistItem)
            .where(WatchlistItem.user_id == user_id)
            .order_by(WatchlistItem.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_user_and_company(
        self, user_id: str, company_id: str
    ) -> WatchlistItem | None:
        """Fetch a watchlist item for a specific (user, company) pair."""
        result = await self.db.execute(
            select(WatchlistItem).where(
                WatchlistItem.user_id == user_id,
                WatchlistItem.company_id == company_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, item_id: str) -> WatchlistItem | None:
        """Fetch a watchlist item by primary key."""
        result = await self.db.execute(
            select(WatchlistItem).where(WatchlistItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        item_id: str,
        user_id: str,
        company_id: str,
        notes: str | None = None,
    ) -> WatchlistItem:
        """Add a company to the user's watchlist."""
        now = datetime.now(UTC)
        item = WatchlistItem(
            id=item_id,
            user_id=user_id,
            company_id=company_id,
            notes=notes,
            created_at=now,
            updated_at=now,
        )
        self.db.add(item)
        await self.db.flush()
        return item

    async def update_notes(
        self,
        item: WatchlistItem,
        notes: str | None,
    ) -> WatchlistItem:
        """Update the notes for a watchlist item."""
        item.notes = notes
        item.updated_at = datetime.now(UTC)
        await self.db.flush()
        return item

    async def delete(self, item: WatchlistItem) -> None:
        """Remove a company from the user's watchlist."""
        await self.db.delete(item)
        await self.db.flush()
