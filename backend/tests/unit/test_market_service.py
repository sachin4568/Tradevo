"""Unit tests for CompanyService and MarketService.

Tests business logic, error handling, and dict conversion.
Uses the shared test fixtures from conftest.py.
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.market.models import Company, MarketSnapshot, NewsArticle
from app.modules.market.service import CompanyService, MarketService

_NOW = datetime(2026, 6, 29, 12, 0, tzinfo=UTC)

# ─── Helpers ───


def make_company(
    company_id: str = "cmp-test1",
    symbol: str = "TEST",
    sector: str = "IT",
    **overrides,
) -> Company:
    data = {
        "id": company_id,
        "name": "Test Company Ltd",
        "symbol": symbol,
        "sector": sector,
        "industry": "Information Technology",
        "exchange": "NSE",
        "market_cap": "1,00,000 Cr",
        "current_price": 1000.00,
        "previous_close": 990.00,
        "day_change": 10.00,
        "day_change_percent": 1.01,
        "volume": 1000000,
        "pe": 25.0,
        "pb": 5.0,
        "dividend_yield": 1.0,
        "week52_high": 1200.00,
        "week52_low": 800.00,
        "description": "A test company.",
        "website": "test.com",
        "founded_year": 2000,
        "employees": 10000,
        "revenue": 50000,
        "net_profit": 10000,
        "debt": 0,
        "cash_flow": 12000,
        "roe": 20.0,
        "roa": 10.0,
        "promotor_holding": 50.0,
        "institutional_holding": 30.0,
        "public_holding": 20.0,
        "created_at": _NOW,
        "updated_at": _NOW,
    }
    data.update(overrides)
    return Company(**data)


async def seed_company(session: AsyncSession, **overrides) -> Company:
    """Insert and flush a company, returning it."""
    c = make_company(**overrides)
    session.add(c)
    await session.flush()
    return c


async def seed_news(session: AsyncSession, company_id: str | None, count: int = 2) -> list[NewsArticle]:
    """Insert news articles and flush."""
    articles = []
    for i in range(count):
        n = NewsArticle(
            id=f"n-svc-{company_id or 'mkt'}-{i}",
            company_id=company_id,
            headline=f"Headline {i}",
            source="Test",
            url="",
            published_at=datetime(2026, 6, 29, 12, 0, tzinfo=UTC),
            summary=f"Summary {i}",
            created_at=_NOW,
        )
        session.add(n)
        articles.append(n)
    await session.flush()
    return articles


# ─── CompanyService Tests ───


class TestCompanyService:
    """Tests for CompanyService business logic."""

    @pytest.mark.asyncio
    async def test_list_companies_returns_dicts(self, test_session: AsyncSession) -> None:
        """list_companies returns list of dicts with camelCase keys."""
        await seed_company(test_session, company_id="cmp-1", symbol="AAA")
        await seed_company(test_session, company_id="cmp-2", symbol="BBB", sector="Banking")
        service = CompanyService(test_session)
        result = await service.list_companies()
        assert len(result) == 2
        # Verify camelCase keys
        assert "currentPrice" in result[0]
        assert "dayChangePercent" in result[0]
        assert "marketCap" in result[0]

    @pytest.mark.asyncio
    async def test_list_companies_sector_filter(self, test_session: AsyncSession) -> None:
        """list_companies with sector filter returns only that sector."""
        await seed_company(test_session, company_id="cmp-1", symbol="AAA", sector="IT")
        await seed_company(test_session, company_id="cmp-2", symbol="BBB", sector="Banking")
        service = CompanyService(test_session)
        result = await service.list_companies(sector="Banking")
        assert len(result) == 1
        assert result[0]["symbol"] == "BBB"

    @pytest.mark.asyncio
    async def test_list_companies_search_filter(self, test_session: AsyncSession) -> None:
        """list_companies with search query filters by name/symbol/sector."""
        await seed_company(test_session, company_id="cmp-1", name="Reliance Test Ltd", symbol="RELIANCE")
        await seed_company(test_session, company_id="cmp-2", name="TCS Test Ltd", symbol="TCS")
        service = CompanyService(test_session)
        result = await service.list_companies(search="reliance")
        assert len(result) == 1
        assert result[0]["id"] == "cmp-1"

    @pytest.mark.asyncio
    async def test_get_company_with_financials_and_news(self, test_session: AsyncSession) -> None:
        """get_company returns company + financials + news."""
        await seed_company(test_session, company_id="cmp-1")
        await seed_news(test_session, company_id="cmp-1", count=2)
        service = CompanyService(test_session)
        result = await service.get_company("cmp-1")
        assert result["id"] == "cmp-1"
        assert "financials" in result
        assert result["financials"]["revenue"] == 50000.0
        assert "news" in result
        assert len(result["news"]) == 2
        assert result["news"][0]["headline"] == "Headline 0"

    @pytest.mark.asyncio
    async def test_get_company_not_found(self, test_session: AsyncSession) -> None:
        """get_company raises NotFoundError for non-existent company."""
        service = CompanyService(test_session)
        with pytest.raises(NotFoundError):
            await service.get_company("cmp-nonexistent")

    @pytest.mark.asyncio
    async def test_get_financials(self, test_session: AsyncSession) -> None:
        """get_financials returns financial dict only."""
        await seed_company(test_session, company_id="cmp-1")
        service = CompanyService(test_session)
        result = await service.get_financials("cmp-1")
        assert result["roe"] == 20.0
        assert result["promotorHolding"] == 50.0
        # Should NOT have company fields
        assert "name" not in result
        assert "symbol" not in result

    @pytest.mark.asyncio
    async def test_get_news(self, test_session: AsyncSession) -> None:
        """get_news returns list of news dicts."""
        await seed_company(test_session, company_id="cmp-1")
        await seed_news(test_session, company_id="cmp-1", count=3)
        service = CompanyService(test_session)
        result = await service.get_news("cmp-1")
        assert len(result) == 3
        assert "headline" in result[0]
        assert "publishedAt" in result[0]

    @pytest.mark.asyncio
    async def test_get_sectors(self, test_session: AsyncSession) -> None:
        """get_sectors returns distinct sector values."""
        await seed_company(test_session, company_id="cmp-1", symbol="AAA", sector="IT")
        await seed_company(test_session, company_id="cmp-2", symbol="BBB", sector="Banking")
        await seed_company(test_session, company_id="cmp-3", symbol="CCC", sector="IT")
        service = CompanyService(test_session)
        sectors = await service.get_sectors()
        assert "IT" in sectors
        assert "Banking" in sectors


# ─── MarketService Tests ───


class TestMarketService:
    """Tests for MarketService business logic."""

    @pytest.mark.asyncio
    async def test_get_overview_returns_correct_shape(self, test_session: AsyncSession) -> None:
        """get_overview returns dict with required keys."""
        await seed_company(test_session, company_id="cmp-1", symbol="GAINER", day_change=10.0, day_change_percent=1.5)
        await seed_company(test_session, company_id="cmp-2", symbol="LOSER", day_change=-5.0, day_change_percent=-0.8)
        # Seed a snapshot for fallback
        snap = MarketSnapshot(
            id="snap-t1",
            status="open",
            indices=[{"name": "NIFTY 50", "value": 24856.70, "change": 128.45, "changePercent": 0.52}],
            sector_performance=[{"sector": "IT", "change": -50.0, "changePercent": -0.5}],
            created_at=_NOW,
        )
        test_session.add(snap)
        await test_session.flush()

        service = MarketService(test_session, market_provider=None, news_provider=None)
        result = await service.get_overview()

        assert "status" in result
        assert "indices" in result
        assert "topGainers" in result
        assert "topLosers" in result
        assert "sectorPerformance" in result
        # With no provider, status comes from snapshot
        assert result["status"] == "open"

    @pytest.mark.asyncio
    async def test_get_overview_computes_top_movers(self, test_session: AsyncSession) -> None:
        """get_overview computes top gainers/losers from company data."""
        await seed_company(test_session, company_id="cmp-1", symbol="AAA", day_change_percent=2.5)
        await seed_company(test_session, company_id="cmp-2", symbol="BBB", day_change_percent=-1.8)

        snap = MarketSnapshot(
            id="snap-t2", status="open", indices=[], sector_performance=[], created_at=_NOW,
        )
        test_session.add(snap)
        await test_session.flush()

        service = MarketService(test_session, market_provider=None, news_provider=None)
        result = await service.get_overview()

        assert len(result["topGainers"]) >= 1
        assert result["topGainers"][0]["companyId"] == "cmp-1"
        assert result["topGainers"][0]["isGainer"] is True
        assert len(result["topLosers"]) >= 1
        assert result["topLosers"][0]["companyId"] == "cmp-2"
        assert result["topLosers"][0]["isGainer"] is False

    @pytest.mark.asyncio
    async def test_get_calendar_returns_list(self, test_session: AsyncSession) -> None:
        """get_calendar returns a list of events."""
        service = MarketService(test_session)
        result = await service.get_calendar()
        assert isinstance(result, list)
        assert len(result) > 0
        assert "date" in result[0]
        assert "event" in result[0]

    @pytest.mark.asyncio
    async def test_get_news_fallback_to_db(self, test_session: AsyncSession) -> None:
        """get_news falls back to database when no provider."""
        await seed_news(test_session, company_id=None, count=2)
        service = MarketService(test_session, news_provider=None)
        result = await service.get_news()
        assert len(result) == 2
        assert result[0]["companyId"] is None

    @pytest.mark.asyncio
    async def test_get_sector_performance_fallback(self, test_session: AsyncSession) -> None:
        """get_sector_performance falls back to snapshot."""
        snap = MarketSnapshot(
            id="snap-t3", status="open", indices=[],
            sector_performance=[{"sector": "IT", "change": -50.0, "changePercent": -0.5}],
            created_at=_NOW,
        )
        test_session.add(snap)
        await test_session.flush()

        service = MarketService(test_session, market_provider=None)
        result = await service.get_sector_performance()
        assert len(result) == 1
        assert result[0]["sector"] == "IT"
