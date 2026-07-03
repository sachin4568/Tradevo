"""Unit tests for CompanyRepository and MarketRepository.

Uses the shared test fixtures from conftest.py (SQLite in-memory,
auto-rollback per test).
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.market.models import Company, MarketSnapshot, NewsArticle
from app.modules.market.repository import CompanyRepository, MarketRepository

_NOW = datetime(2026, 6, 29, 12, 0, tzinfo=UTC)

# ─── Test Data Factories ───


def make_company(
    company_id: str = "cmp-test1",
    symbol: str = "TEST",
    sector: str = "IT",
    **overrides,
) -> Company:
    """Create a Company instance with sensible defaults."""
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


def make_news(
    news_id: str = "n-test1",
    company_id: str | None = None,
    **overrides,
) -> NewsArticle:
    """Create a NewsArticle instance with sensible defaults."""
    from datetime import datetime

    data = {
        "id": news_id,
        "company_id": company_id,
        "headline": "Test headline",
        "source": "Test Source",
        "url": "https://example.com",
        "published_at": datetime(2026, 6, 29, 12, 0, tzinfo=UTC),
        "summary": "Test summary",
        "created_at": _NOW,
    }
    data.update(overrides)
    return NewsArticle(**data)


# ─── CompanyRepository Tests ───


class TestCompanyRepository:
    """Tests for CompanyRepository data access methods."""

    async def _seed_companies(self, session: AsyncSession, count: int = 3) -> list[Company]:
        """Helper to seed companies for tests."""
        companies = []
        for i in range(count):
            c = make_company(
                company_id=f"cmp-test{i}",
                symbol=f"TEST{i}",
                sector="IT" if i % 2 == 0 else "Banking",
                name=f"Test Company {i} Ltd",
            )
            session.add(c)
            companies.append(c)
        await session.flush()
        return companies

    @pytest.mark.asyncio
    async def test_list_all_returns_all(self, test_session: AsyncSession) -> None:
        """list_all with no filters returns all companies."""
        await self._seed_companies(test_session, 3)
        repo = CompanyRepository(test_session)
        result = await repo.list_all()
        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_list_all_filters_by_sector(self, test_session: AsyncSession) -> None:
        """list_all with sector filter returns only matching companies."""
        await self._seed_companies(test_session, 4)
        repo = CompanyRepository(test_session)
        result = await repo.list_all(sector="IT")
        assert all(c.sector == "IT" for c in result)
        assert len(result) == 2  # 0 and 2 are IT

    @pytest.mark.asyncio
    async def test_list_all_filters_by_search(self, test_session: AsyncSession) -> None:
        """list_all with search query matches name, symbol, or sector."""
        await self._seed_companies(test_session, 3)
        repo = CompanyRepository(test_session)
        # Search by name
        result = await repo.list_all(search="Company 1")
        assert len(result) == 1
        assert result[0].id == "cmp-test1"
        # Search by symbol
        result = await repo.list_all(search="TEST2")
        assert len(result) == 1
        # Search by sector
        result = await repo.list_all(search="Banking")
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_get_by_id(self, test_session: AsyncSession) -> None:
        """get_by_id returns the correct company."""
        await self._seed_companies(test_session, 1)
        repo = CompanyRepository(test_session)
        result = await repo.get_by_id("cmp-test0")
        assert result is not None
        assert result.symbol == "TEST0"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, test_session: AsyncSession) -> None:
        """get_by_id returns None for non-existent ID."""
        repo = CompanyRepository(test_session)
        result = await repo.get_by_id("cmp-nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_symbol(self, test_session: AsyncSession) -> None:
        """get_by_symbol returns the correct company."""
        await self._seed_companies(test_session, 1)
        repo = CompanyRepository(test_session)
        result = await repo.get_by_symbol("TEST0")
        assert result is not None
        assert result.id == "cmp-test0"

    @pytest.mark.asyncio
    async def test_get_distinct_sectors(self, test_session: AsyncSession) -> None:
        """get_distinct_sectors returns unique sector names."""
        await self._seed_companies(test_session, 4)
        repo = CompanyRepository(test_session)
        sectors = await repo.get_distinct_sectors()
        assert "IT" in sectors
        assert "Banking" in sectors


# ─── MarketRepository Tests ───


class TestMarketRepository:
    """Tests for MarketRepository data access methods."""

    async def _seed_snapshot(self, session: AsyncSession) -> MarketSnapshot:
        """Helper to seed a market snapshot."""
        snapshot = MarketSnapshot(
            id="snap-test1",
            status="open",
            indices=[
                {"name": "NIFTY 50", "value": 24856.70, "change": 128.45, "changePercent": 0.52}
            ],
            sector_performance=[
                {"sector": "IT", "change": -50, "changePercent": -0.5}
            ],
            created_at=_NOW,
        )
        session.add(snapshot)
        await session.flush()
        return snapshot

    async def _seed_news(
        self, session: AsyncSession, count: int = 3
    ) -> list[NewsArticle]:
        """Helper to seed news articles."""
        articles = []
        for i in range(count):
            n = make_news(
                news_id=f"n-test{i}",
                company_id="cmp-test0" if i < 2 else None,
                headline=f"Test headline {i}",
            )
            session.add(n)
            articles.append(n)
        await session.flush()
        return articles

    @pytest.mark.asyncio
    async def test_get_latest_snapshot(self, test_session: AsyncSession) -> None:
        """get_latest_snapshot returns the most recent snapshot."""
        await self._seed_snapshot(test_session)
        repo = MarketRepository(test_session)
        result = await repo.get_latest_snapshot()
        assert result is not None
        assert result.status == "open"

    @pytest.mark.asyncio
    async def test_get_latest_snapshot_empty(self, test_session: AsyncSession) -> None:
        """get_latest_snapshot returns None when no snapshots exist."""
        repo = MarketRepository(test_session)
        result = await repo.get_latest_snapshot()
        assert result is None

    @pytest.mark.asyncio
    async def test_save_snapshot(self, test_session: AsyncSession) -> None:
        """save_snapshot persists a new snapshot."""
        repo = MarketRepository(test_session)
        snapshot = await repo.save_snapshot(
            snapshot_id="snap-new",
            status="open",
            indices=[{"name": "NIFTY 50", "value": 25000, "change": 100, "changePercent": 0.4}],
            sector_performance=[{"sector": "Banking", "change": 50, "changePercent": 0.3}],
        )
        assert snapshot.id == "snap-new"
        assert snapshot.status == "open"

    @pytest.mark.asyncio
    async def test_list_news_company_specific(self, test_session: AsyncSession) -> None:
        """list_company_news returns only articles for the specified company."""
        await self._seed_news(test_session, 3)
        repo = MarketRepository(test_session)
        result = await repo.list_company_news("cmp-test0")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_list_news_market_level(self, test_session: AsyncSession) -> None:
        """list_news with no company_id returns market-level news."""
        await self._seed_news(test_session, 3)
        repo = MarketRepository(test_session)
        result = await repo.list_news(company_id=None)
        assert len(result) == 1
        assert result[0].company_id is None
