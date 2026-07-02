"""Market data access layer (CompanyRepository + MarketRepository).

Follows the Repository Pattern: constructor-injected AsyncSession,
returns SQLAlchemy model instances, uses flush() (commit at service layer).
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.market.models import Company, MarketSnapshot, NewsArticle


class CompanyRepository:
    """Data access for Company entity."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_all(
        self,
        *,
        sector: str | None = None,
        search: str | None = None,
    ) -> list[Company]:
        """List companies with optional sector and search filters.

        Search matches against name, symbol, or sector (case-insensitive).
        """
        stmt = select(Company).order_by(Company.symbol)
        if sector is not None:
            stmt = stmt.where(Company.sector == sector)
        if search is not None:
            pattern = f"%{search}%"
            stmt = stmt.where(
                (Company.name.ilike(pattern))
                | (Company.symbol.ilike(pattern))
                | (Company.sector.ilike(pattern))
            )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, company_id: str) -> Company | None:
        """Fetch a company by primary key."""
        result = await self.db.execute(
            select(Company).where(Company.id == company_id)
        )
        return result.scalar_one_or_none()

    async def get_by_symbol(self, symbol: str) -> Company | None:
        """Fetch a company by ticker symbol."""
        result = await self.db.execute(
            select(Company).where(Company.symbol == symbol)
        )
        return result.scalar_one_or_none()

    async def get_distinct_sectors(self) -> list[str]:
        """Return all distinct sector values."""
        result = await self.db.execute(
            select(Company.sector).distinct().order_by(Company.sector)
        )
        return list(result.scalars().all())


class MarketRepository:
    """Data access for MarketSnapshot and NewsArticle entities."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── MarketSnapshot ───

    async def get_latest_snapshot(self) -> MarketSnapshot | None:
        """Return the most recent market snapshot."""
        stmt = (
            select(MarketSnapshot)
            .order_by(MarketSnapshot.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def save_snapshot(
        self,
        snapshot_id: str,
        status: str,
        indices: list[dict],
        sector_performance: list[dict],
    ) -> MarketSnapshot:
        """Persist a new market snapshot."""
        snapshot = MarketSnapshot(
            id=snapshot_id,
            status=status,
            indices=indices,
            sector_performance=sector_performance,
            created_at=datetime.now(UTC),
        )
        self.db.add(snapshot)
        await self.db.flush()
        return snapshot

    # ─── NewsArticle ───

    async def list_news(
        self,
        *,
        company_id: str | None = None,
        limit: int = 20,
    ) -> list[NewsArticle]:
        """List news articles, optionally filtered by company.

        When company_id is None, returns market-level news (company_id IS NULL).
        Returns articles ordered by published_at descending.
        """
        stmt = select(NewsArticle).order_by(NewsArticle.published_at.desc())
        if company_id is not None:
            stmt = stmt.where(NewsArticle.company_id == company_id)
        else:
            stmt = stmt.where(NewsArticle.company_id.is_(None))
        stmt = stmt.limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_company_news(
        self,
        company_id: str,
        limit: int = 10,
    ) -> list[NewsArticle]:
        """List news articles for a specific company."""
        stmt = (
            select(NewsArticle)
            .where(NewsArticle.company_id == company_id)
            .order_by(NewsArticle.published_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def save_news(self, articles_data: list[dict]) -> list[NewsArticle]:
        """Bulk-insert news articles. Returns the created models."""
        articles = []
        for data in articles_data:
            article = NewsArticle(**data)
            self.db.add(article)
            articles.append(article)
        if articles:
            await self.db.flush()
        return articles
