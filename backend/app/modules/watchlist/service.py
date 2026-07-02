"""Watchlist business logic.

WatchlistService: add, remove, list, and update watchlist items.
Enriches items with company data from CompanyRepository.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, NotFoundError
from app.core.utils import generate_entity_id
from app.modules.market.repository import CompanyRepository
from app.modules.watchlist.repository import WatchlistRepository

logger = logging.getLogger(__name__)


class WatchlistService:
    """Watchlist management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = WatchlistRepository(db)
        self.company_repo = CompanyRepository(db)

    async def list_items(self, user_id: str) -> list[dict]:
        """Get all watchlist items with company metadata.

        Returns items enriched with current company price data
        matching the frontend WatchlistItem type.
        """
        items = await self.repo.list_by_user(user_id)
        result = []
        for item in items:
            company = await self.company_repo.get_by_id(item.company_id)
            if company is None:
                continue
            result.append(self._to_dict(item, company))
        return result

    async def add_item(
        self,
        user_id: str,
        company_id: str,
        notes: str | None = None,
    ) -> dict:
        """Add a company to the user's watchlist.

        Raises:
            NotFoundError: If the company does not exist.
            DuplicateResourceError: If the company is already in the watchlist.
        """
        company = await self.company_repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")

        existing = await self.repo.get_by_user_and_company(user_id, company_id)
        if existing is not None:
            raise DuplicateResourceError(
                message="Company is already in your watchlist",
                error_code="ALREADY_IN_WATCHLIST",
            )

        item = await self.repo.create(
            item_id=generate_entity_id("wti"),
            user_id=user_id,
            company_id=company_id,
            notes=notes,
        )
        logger.info(
            "Watchlist item added: user=%s company=%s",
            user_id,
            company_id,
        )
        return self._to_dict(item, company)

    async def remove_item(self, user_id: str, item_id: str) -> None:
        """Remove a company from the user's watchlist.

        Raises:
            NotFoundError: If the item does not exist or belongs to another user.
        """
        item = await self.repo.get_by_id(item_id)
        if item is None or item.user_id != user_id:
            raise NotFoundError(message="Watchlist item not found")
        await self.repo.delete(item)
        logger.info(
            "Watchlist item removed: user=%s item=%s",
            user_id,
            item_id,
        )

    async def update_notes(
        self,
        user_id: str,
        item_id: str,
        notes: str | None,
    ) -> dict:
        """Update the notes for a watchlist item.

        Raises:
            NotFoundError: If the item does not exist or belongs to another user.
        """
        item = await self.repo.get_by_id(item_id)
        if item is None or item.user_id != user_id:
            raise NotFoundError(message="Watchlist item not found")

        item = await self.repo.update_notes(item, notes)
        company = await self.company_repo.get_by_id(item.company_id)
        return self._to_dict(item, company)

    @staticmethod
    def _to_dict(item, company) -> dict:
        """Convert WatchlistItem + Company to camelCase dict."""
        return {
            "id": item.id,
            "userId": item.user_id,
            "companyId": item.company_id,
            "companyName": company.name if company else "",
            "symbol": company.symbol if company else "",
            "sector": company.sector if company else "",
            "currentPrice": float(company.current_price) if company else 0,
            "dayChange": float(company.day_change) if company else 0,
            "dayChangePercent": float(company.day_change_percent) if company else 0,
            "notes": item.notes or "",
            "addedAt": item.created_at.isoformat() if item.created_at else "",
        }