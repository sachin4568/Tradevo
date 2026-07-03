"""Unit tests for PortfolioRepository, HoldingRepository, and TransactionRepository.

Uses shared test fixtures from conftest.py (SQLite in-memory, auto-rollback).
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.market.models import Company
from app.modules.portfolio.models import Holding, Portfolio, Transaction
from app.modules.portfolio.repository import (
    HoldingRepository,
    PortfolioRepository,
    TransactionRepository,
)

_NOW = datetime(2026, 6, 29, 12, 0, tzinfo=UTC)


def make_user(user_id: str = "usr-test1", **overrides) -> User:
    data = {
        "id": user_id,
        "name": "Test User",
        "email": f"test{user_id[-4:]}@example.com",
        "password_hash": "hashed_pw",
        "experience_level": "beginner",
        "risk_preference": "moderate",
        "created_at": _NOW,
        "updated_at": _NOW,
    }
    data.update(overrides)
    return User(**data)


def make_company(company_id: str = "cmp-test1", symbol: str = "TEST", **overrides) -> Company:
    data = {
        "id": company_id,
        "name": "Test Company Ltd",
        "symbol": symbol,
        "sector": "IT",
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


def make_portfolio(
    portfolio_id: str = "pfl-test1",
    user_id: str = "usr-test1",
    **overrides,
) -> Portfolio:
    data = {
        "id": portfolio_id,
        "user_id": user_id,
        "virtual_cash": 1_000_000.00,
        "total_invested": 0,
        "total_returns": 0,
        "created_at": _NOW,
        "updated_at": _NOW,
    }
    data.update(overrides)
    return Portfolio(**data)


def make_holding(
    holding_id: str = "hld-test1",
    portfolio_id: str = "pfl-test1",
    company_id: str = "cmp-test1",
    **overrides,
) -> Holding:
    data = {
        "id": holding_id,
        "portfolio_id": portfolio_id,
        "company_id": company_id,
        "quantity": 10,
        "average_price": 100.00,
        "last_updated": _NOW,
    }
    data.update(overrides)
    return Holding(**data)


def make_transaction(
    txn_id: str = "txn-test1",
    portfolio_id: str = "pfl-test1",
    company_id: str = "cmp-test1",
    **overrides,
) -> Transaction:
    data = {
        "id": txn_id,
        "portfolio_id": portfolio_id,
        "company_id": company_id,
        "transaction_type": "BUY",
        "quantity": 10,
        "price": 100.00,
        "total": 1000.00,
        "status": "COMPLETED",
        "created_at": _NOW,
    }
    data.update(overrides)
    return Transaction(**data)


async def seed_user(session: AsyncSession, user_id: str = "usr-test1") -> User:
    u = make_user(user_id=user_id)
    session.add(u)
    await session.flush()
    return u


async def seed_company(session: AsyncSession, **overrides) -> Company:
    c = make_company(**overrides)
    session.add(c)
    await session.flush()
    return c


async def seed_portfolio(
    session: AsyncSession, user_id: str = "usr-test1", **overrides
) -> Portfolio:
    p = make_portfolio(user_id=user_id, **overrides)
    session.add(p)
    await session.flush()
    return p


# ─── PortfolioRepository Tests ───


class TestPortfolioRepository:
    @pytest.mark.asyncio
    async def test_create_portfolio(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        repo = PortfolioRepository(test_session)
        portfolio = await repo.create("pfl-new", "usr-test1")
        assert portfolio.id == "pfl-new"
        assert float(portfolio.virtual_cash) == 1_000_000.00

    @pytest.mark.asyncio
    async def test_get_by_user_id(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        await seed_portfolio(test_session)
        repo = PortfolioRepository(test_session)
        result = await repo.get_by_user_id("usr-test1")
        assert result is not None
        assert result.user_id == "usr-test1"

    @pytest.mark.asyncio
    async def test_get_by_user_id_not_found(self, test_session: AsyncSession) -> None:
        repo = PortfolioRepository(test_session)
        result = await repo.get_by_user_id("usr-nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_id(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        await seed_portfolio(test_session, portfolio_id="pfl-findme")
        repo = PortfolioRepository(test_session)
        result = await repo.get_by_id("pfl-findme")
        assert result is not None

    @pytest.mark.asyncio
    async def test_update_cash(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        await seed_portfolio(test_session)
        repo = PortfolioRepository(test_session)
        await repo.update_cash("pfl-test1", 500_000.00)
        # Re-fetch to verify
        portfolio = await repo.get_by_id("pfl-test1")
        assert float(portfolio.virtual_cash) == 500_000.00

    @pytest.mark.asyncio
    async def test_update_investment_totals(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        await seed_portfolio(test_session)
        repo = PortfolioRepository(test_session)
        await repo.update_investment_totals("pfl-test1", total_invested=50000, total_returns=2500)
        portfolio = await repo.get_by_id("pfl-test1")
        assert float(portfolio.total_invested) == 50000
        assert float(portfolio.total_returns) == 2500


# ─── HoldingRepository Tests ───


class TestHoldingRepository:
    async def _seed_holding_data(self, session: AsyncSession) -> None:
        await seed_user(session)
        await seed_company(session)
        await seed_portfolio(session)

    @pytest.mark.asyncio
    async def test_create_holding(self, test_session: AsyncSession) -> None:
        await self._seed_holding_data(test_session)
        repo = HoldingRepository(test_session)
        holding = await repo.create("hld-new", "pfl-test1", "cmp-test1", 10, 100.00)
        assert holding.id == "hld-new"
        assert int(holding.quantity) == 10
        assert float(holding.average_price) == 100.00

    @pytest.mark.asyncio
    async def test_get_by_portfolio_and_company(self, test_session: AsyncSession) -> None:
        await self._seed_holding_data(test_session)
        h = make_holding()
        test_session.add(h)
        await test_session.flush()
        repo = HoldingRepository(test_session)
        result = await repo.get_by_portfolio_and_company("pfl-test1", "cmp-test1")
        assert result is not None
        assert int(result.quantity) == 10

    @pytest.mark.asyncio
    async def test_get_by_portfolio_and_company_not_found(
        self, test_session: AsyncSession
    ) -> None:
        repo = HoldingRepository(test_session)
        result = await repo.get_by_portfolio_and_company("pfl-nope", "cmp-nope")
        assert result is None

    @pytest.mark.asyncio
    async def test_list_by_portfolio(self, test_session: AsyncSession) -> None:
        await self._seed_holding_data(test_session)
        await seed_company(test_session, company_id="cmp-test2", symbol="BBB")
        h1 = make_holding(holding_id="hld-1")
        h2 = make_holding(holding_id="hld-2", company_id="cmp-test2")
        test_session.add(h1)
        test_session.add(h2)
        await test_session.flush()
        repo = HoldingRepository(test_session)
        result = await repo.list_by_portfolio("pfl-test1")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_update_holding(self, test_session: AsyncSession) -> None:
        await self._seed_holding_data(test_session)
        h = make_holding()
        test_session.add(h)
        await test_session.flush()
        repo = HoldingRepository(test_session)
        holding = await repo.get_by_portfolio_and_company("pfl-test1", "cmp-test1")
        updated = await repo.update_holding(holding, quantity=20, average_price=95.50)
        assert int(updated.quantity) == 20
        assert float(updated.average_price) == 95.50

    @pytest.mark.asyncio
    async def test_delete_holding(self, test_session: AsyncSession) -> None:
        await self._seed_holding_data(test_session)
        h = make_holding()
        test_session.add(h)
        await test_session.flush()
        repo = HoldingRepository(test_session)
        holding = await repo.get_by_portfolio_and_company("pfl-test1", "cmp-test1")
        assert holding is not None
        await repo.delete_holding(holding)
        result = await repo.get_by_portfolio_and_company("pfl-test1", "cmp-test1")
        assert result is None


# ─── TransactionRepository Tests ───


class TestTransactionRepository:
    async def _seed_transaction_data(self, session: AsyncSession) -> None:
        await seed_user(session)
        await seed_company(session)
        await seed_portfolio(session)

    @pytest.mark.asyncio
    async def test_create_transaction(self, test_session: AsyncSession) -> None:
        await self._seed_transaction_data(test_session)
        repo = TransactionRepository(test_session)
        txn = await repo.create(
            "txn-new", "pfl-test1", "cmp-test1", "BUY", 10, 100.00, 1000.00
        )
        assert txn.id == "txn-new"
        assert txn.transaction_type == "BUY"

    @pytest.mark.asyncio
    async def test_list_by_portfolio(self, test_session: AsyncSession) -> None:
        await self._seed_transaction_data(test_session)
        t1 = make_transaction(txn_id="txn-1")
        t2 = make_transaction(txn_id="txn-2", quantity=5, price=200.00, total=1000.00)
        test_session.add(t1)
        test_session.add(t2)
        await test_session.flush()
        repo = TransactionRepository(test_session)
        result = await repo.list_by_portfolio("pfl-test1")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_list_by_portfolio_paginated(self, test_session: AsyncSession) -> None:
        await self._seed_transaction_data(test_session)
        for i in range(5):
            t = make_transaction(txn_id=f"txn-pg{i}")
            test_session.add(t)
        await test_session.flush()
        repo = TransactionRepository(test_session)
        result = await repo.list_by_portfolio("pfl-test1", limit=2, offset=0)
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_count_by_portfolio(self, test_session: AsyncSession) -> None:
        await self._seed_transaction_data(test_session)
        for i in range(3):
            t = make_transaction(txn_id=f"txn-cnt{i}")
            test_session.add(t)
        await test_session.flush()
        repo = TransactionRepository(test_session)
        count = await repo.count_by_portfolio("pfl-test1")
        assert count == 3

    @pytest.mark.asyncio
    async def test_get_by_id(self, test_session: AsyncSession) -> None:
        await self._seed_transaction_data(test_session)
        t = make_transaction(txn_id="txn-find")
        test_session.add(t)
        await test_session.flush()
        repo = TransactionRepository(test_session)
        result = await repo.get_by_id("txn-find")
        assert result is not None
        assert result.transaction_type == "BUY"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, test_session: AsyncSession) -> None:
        repo = TransactionRepository(test_session)
        result = await repo.get_by_id("txn-nonexistent")
        assert result is None
