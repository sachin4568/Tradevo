"""Company and Market business logic.

CompanyService: company listing, detail, financials, news.
MarketService: market overview, sector performance, calendar, news.
Graceful degradation: if the provider is unavailable, the service
returns the latest stored snapshot from the database.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.utils import generate_entity_id
from app.integrations.market.base import MarketProvider
from app.integrations.news.base import NewsProvider as NewsProviderInterface
from app.modules.market.models import Company, NewsArticle
from app.modules.market.repository import CompanyRepository, MarketRepository

logger = logging.getLogger(__name__)


class CompanyService:
    """Service for company-related operations.

    Handles company listing, detail retrieval (with financials and news),
    and company-specific news queries.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.repo = CompanyRepository(db)
        self.market_repo = MarketRepository(db)

    async def list_companies(
        self,
        *,
        sector: str | None = None,
        search: str | None = None,
    ) -> list[dict]:
        """List all companies, optionally filtered by sector or search query.

        Returns a list of company dicts in camelCase matching the
        frontend Company type.
        """
        companies = await self.repo.list_all(sector=sector, search=search)
        return [self._company_to_dict(c) for c in companies]

    async def get_company(self, company_id: str) -> dict:
        """Get full company detail including financials and news.

        Returns a dict matching the frontend CompanyDetail type:
        all Company fields + financials object + news array.
        """
        company = await self.repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")

        news = await self.market_repo.list_company_news(company_id)

        return {
            **self._company_to_dict(company),
            "financials": self._financials_to_dict(company),
            "news": [self._news_to_dict(n) for n in news],
        }

    async def get_financials(self, company_id: str) -> dict:
        """Get financial summary for a company."""
        company = await self.repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")
        return self._financials_to_dict(company)

    async def get_news(self, company_id: str, limit: int = 10) -> list[dict]:
        """Get news articles for a specific company."""
        company = await self.repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")

        news = await self.market_repo.list_company_news(company_id, limit=limit)
        return [self._news_to_dict(n) for n in news]

    async def get_sectors(self) -> list[str]:
        """Get all distinct sector values."""
        return await self.repo.get_distinct_sectors()

    # ─── Dict Converters (camelCase for frontend) ───

    @staticmethod
    def _company_to_dict(c: Company) -> dict:
        """Convert Company model to camelCase dict matching frontend Company type."""
        return {
            "id": c.id,
            "name": c.name,
            "symbol": c.symbol,
            "sector": c.sector,
            "industry": c.industry,
            "exchange": c.exchange,
            "marketCap": c.market_cap,
            "currentPrice": float(c.current_price),
            "previousClose": float(c.previous_close),
            "dayChange": float(c.day_change),
            "dayChangePercent": float(c.day_change_percent),
            "volume": c.volume,
            "pe": float(c.pe),
            "pb": float(c.pb),
            "dividendYield": float(c.dividend_yield),
            "week52High": float(c.week52_high),
            "week52Low": float(c.week52_low),
            "description": c.description,
            "website": c.website,
            "foundedYear": c.founded_year,
            "employees": c.employees,
        }

    @staticmethod
    def _financials_to_dict(c: Company) -> dict:
        """Extract financial fields from Company model."""
        return {
            "revenue": float(c.revenue),
            "netProfit": float(c.net_profit),
            "debt": float(c.debt),
            "cashFlow": float(c.cash_flow),
            "roe": float(c.roe),
            "roa": float(c.roa),
            "promotorHolding": float(c.promotor_holding),
            "institutionalHolding": float(c.institutional_holding),
            "publicHolding": float(c.public_holding),
        }

    @staticmethod
    def _news_to_dict(n: NewsArticle) -> dict:
        """Convert NewsArticle model to camelCase dict."""
        return {
            "id": n.id,
            "companyId": n.company_id,
            "headline": n.headline,
            "source": n.source,
            "url": n.url,
            "publishedAt": n.published_at.isoformat() if n.published_at else "",
            "summary": n.summary,
            "sentiment": n.sentiment,
        }


class MarketService:
    """Service for market-wide operations.

    Coordinates between the MarketProvider (external data) and the
    MarketRepository (database) to provide market overviews, sector
    performance, market calendar, and news.

    Graceful degradation: if the provider is unavailable or not
    configured, falls back to the latest stored snapshot.
    """

    def __init__(
        self,
        db: AsyncSession,
        *,
        market_provider: MarketProvider | None = None,
        news_provider: NewsProviderInterface | None = None,
    ) -> None:
        self.repo = MarketRepository(db)
        self.company_repo = CompanyRepository(db)
        self.market_provider = market_provider
        self.news_provider = news_provider

    async def get_overview(self) -> dict:
        """Get the full market overview.

        Tries the provider first; if unavailable, returns the latest
        stored snapshot. Computes top gainers/losers from company data.

        Returns a dict matching the frontend MarketOverview type:
        { status, indices, topGainers, topLosers, sectorPerformance }
        """
        indices: list[dict] = []
        sector_perf: list[dict] = []
        status = "closed"

        # Try provider first
        provider_ok = False
        if self.market_provider is not None:
            try:
                overview = await self.market_provider.get_market_overview()
                indices = overview.indices
                status = overview.market_status
                provider_ok = True
            except Exception:
                logger.warning("Market provider failed, falling back to snapshot")

        if not provider_ok:
            snapshot = await self.repo.get_latest_snapshot()
            if snapshot is not None:
                indices = snapshot.indices
                sector_perf = snapshot.sector_performance
                status = snapshot.status

        # Get sector performance from provider if available
        if provider_ok and self.market_provider is not None:
            try:
                sectors = await self.market_provider.get_sector_performance()
                sector_perf = [
                    {
                        "sector": s.sector,
                        "change": float(s.change_percent) * 100,
                        "changePercent": float(s.change_percent),
                    }
                    for s in sectors
                ]
            except Exception:
                logger.warning("Sector performance fetch failed, using stored data")

        # Compute top movers from company data
        companies = await self.company_repo.list_all()
        sorted_by_change = sorted(
            companies,
            key=lambda c: abs(float(c.day_change_percent)),
            reverse=True,
        )
        gainers = [
            self._company_to_top_mover(c, is_gainer=True)
            for c in sorted_by_change
            if float(c.day_change_percent) > 0
        ][:5]
        losers = [
            self._company_to_top_mover(c, is_gainer=False)
            for c in sorted_by_change
            if float(c.day_change_percent) < 0
        ][:5]

        return {
            "status": status,
            "indices": indices,
            "topGainers": gainers,
            "topLosers": losers,
            "sectorPerformance": sector_perf,
        }

    async def get_sector_performance(self) -> list[dict]:
        """Get sector performance data.

        Tries the provider first; falls back to the latest snapshot.
        """
        if self.market_provider is not None:
            try:
                sectors = await self.market_provider.get_sector_performance()
                return [
                    {
                        "sector": s.sector,
                        "change": float(s.change_percent) * 100,
                        "changePercent": float(s.change_percent),
                    }
                    for s in sectors
                ]
            except Exception:
                logger.warning("Market provider failed for sector data")

        snapshot = await self.repo.get_latest_snapshot()
        if snapshot is not None:
            return snapshot.sector_performance
        return []

    async def get_calendar(self) -> list[dict]:
        """Get upcoming market calendar events.

        Returns a list of market holidays and trading events.
        For the mock, returns hardcoded Indian market holidays.
        """
        return [
            {
                "date": "2026-07-04",
                "event": "Id-Ul-Zuha (Bakri Id)",
                "type": "holiday",
            },
            {
                "date": "2026-07-17",
                "event": "Muharram",
                "type": "holiday",
            },
            {
                "date": "2026-08-15",
                "event": "Independence Day",
                "type": "holiday",
            },
            {
                "date": "2026-08-27",
                "event": "Janmashtami",
                "type": "holiday",
            },
            {
                "date": "2026-09-05",
                "event": "Ganesh Chaturthi",
                "type": "holiday",
            },
            {
                "date": "2026-10-02",
                "event": "Mahatma Gandhi Jayanti",
                "type": "holiday",
            },
            {
                "date": "2026-10-20",
                "event": "Dussehra (Vijaya Dashami)",
                "type": "holiday",
            },
            {
                "date": "2026-11-10",
                "event": "Diwali (Laxmi Pujan)",
                "type": "holiday",
            },
            {
                "date": "2026-12-25",
                "event": "Christmas",
                "type": "holiday",
            },
        ]

    async def get_news(self, limit: int = 20) -> list[dict]:
        """Get market-level news articles.

        Tries the news provider first; falls back to stored articles.
        """
        if self.news_provider is not None:
            try:
                articles = await self.news_provider.get_latest_news(limit=limit)
                return [
                    {
                        "id": f"mn-{i+1:03d}",
                        "companyId": None,
                        "headline": a.headline,
                        "source": a.source,
                        "url": a.url,
                        "publishedAt": a.published_at.isoformat(),
                        "summary": a.summary,
                        "sentiment": a.sentiment,
                    }
                    for i, a in enumerate(articles)
                ]
            except Exception:
                logger.warning("News provider failed, falling back to stored news")

        # Fallback: fetch from database
        stored = await self.repo.list_news(company_id=None, limit=limit)
        return [
            {
                "id": n.id,
                "companyId": n.company_id,
                "headline": n.headline,
                "source": n.source,
                "url": n.url,
                "publishedAt": n.published_at.isoformat() if n.published_at else "",
                "summary": n.summary,
                "sentiment": n.sentiment,
            }
            for n in stored
        ]

    async def save_snapshot(
        self,
        status: str,
        indices: list[dict],
        sector_performance: list[dict],
    ) -> None:
        """Persist a market snapshot for graceful degradation.

        Called after a successful provider fetch so the latest data
        is available even when the provider is down.
        """
        snapshot_id = generate_entity_id("snap")
        await self.repo.save_snapshot(
            snapshot_id=snapshot_id,
            status=status,
            indices=indices,
            sector_performance=sector_performance,
        )
        await self.repo.db.commit()

    @staticmethod
    def _company_to_top_mover(c: Company, *, is_gainer: bool) -> dict:
        """Convert a Company model to a TopMover dict."""
        return {
            "companyId": c.id,
            "symbol": c.symbol,
            "name": c.name,
            "price": float(c.current_price),
            "change": float(c.day_change),
            "changePercent": float(c.day_change_percent),
            "isGainer": is_gainer,
        }
