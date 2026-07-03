"""Unit tests for PortfolioService (read operations).

Tests portfolio summary, holdings listing, and transaction history.
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.auth.models import User
from app.modules.market.models import Company
from app.modules.portfolio.models import Holding, Portfolio, Transaction
from app.modules.portfolio.service import PortfolioService

_NOW = datetime(2026, 6, 29, 12, 0, tzinfo=UTC)


def _user(uid: str = "usr-ps1") -> User:
    return User(
        id=uid, name="Test", email=f"{uid}@t.com", password_hash="h",
        experience_level="beginner", risk_preference="moderate",
        created_at=_NOW, updated_at=_NOW,
    )


def _company(cid: str = "cmp-ps1", price: float = 100.0) -> Company:
    return Company(
        id=cid, name="Co", symbol=f"S{cid[-1]}", sector="IT",
        industry="IT", exchange="NSE", market_cap="1L",
        current_price=price, previous_close=price - 1, day_change=1.0,
        day_change_percent=1.0, volume=1000, pe=25.0, pb=5.0,
        dividend_yield=1.0, week52_high=120.0, week52_low=80.0,
        description=".", website=".", founded_year=2000, employees=100,
        revenue=50000, net_profit=10000, debt=0, cash_flow=12000,
        roe=20.0, roa=10.0, promotor_holding=50.0,
        institutional_holding=30.0, public_holding=20.0,
        created_at=_NOW, updated_at=_NOW,
    )


def _portfolio(uid: str = "usr-ps1", cash: float = 1_000_000.0) -> Portfolio:
    return Portfolio(
        id=f"pfl-{uid[-2:]}", user_id=uid, virtual_cash=cash,
        total_invested=0, total_returns=0,
        created_at=_NOW, updated_at=_NOW,
    )


async def seed_full(test_session: AsyncSession):
    """Seed user, company, portfolio, holding, and transaction."""
    u = _user()
    c = _company(price=120.0)
    p = _portfolio()
    h = Holding(
        id="hld-ps1", portfolio_id=p.id, company_id=c.id,
        quantity=10, average_price=100.0, last_updated=_NOW,
    )
    t = Transaction(
        id="txn-ps1", portfolio_id=p.id, company_id=c.id,
        transaction_type="BUY", quantity=10, price=100.0,
        total=1000.0, status="COMPLETED", created_at=_NOW,
    )
    for obj in [u, c, p, h, t]:
        test_session.add(obj)
    await test_session.flush()
    return u.id, c.id, p.id


class TestPortfolioService:
    @pytest.mark.asyncio
    async def test_get_summary_returns_correct_shape(self, test_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_full(test_session)
        service = PortfolioService(test_session)
        result = await service.get_summary(user_id)
        assert "virtualCash" in result
        assert "totalValue" in result
        assert "holdingsValue" in result
        assert "holdings" in result
        assert len(result["holdings"]) == 1

    @pytest.mark.asyncio
    async def test_get_summary_computes_holdings_value(self, test_session: AsyncSession) -> None:
        user_id, _, _ = await seed_full(test_session)
        service = PortfolioService(test_session)
        result = await service.get_summary(user_id)
        # 10 shares @ current price 120 = 1200
        assert result["holdingsValue"] == 1200.0
        # total = cash (1M) + holdings (1200)
        assert result["totalValue"] == 1_001_200.0

    @pytest.mark.asyncio
    async def test_get_summary_computes_pnl(self, test_session: AsyncSession) -> None:
        user_id, _, _ = await seed_full(test_session)
        service = PortfolioService(test_session)
        result = await service.get_summary(user_id)
        h = result["holdings"][0]
        # Bought at 100, current at 120: P&L = 200
        assert h["pnl"] == 200.0
        assert h["pnlPercent"] == 20.0

    @pytest.mark.asyncio
    async def test_get_summary_no_portfolio_raises(self, test_session: AsyncSession) -> None:
        u = _user(uid="usr-nopf")
        test_session.add(u)
        await test_session.flush()
        service = PortfolioService(test_session)
        with pytest.raises(NotFoundError, match="Portfolio not found"):
            await service.get_summary("usr-nopf")

    @pytest.mark.asyncio
    async def test_get_holdings(self, test_session: AsyncSession) -> None:
        user_id, _, _ = await seed_full(test_session)
        service = PortfolioService(test_session)
        holdings = await service.get_holdings(user_id)
        assert len(holdings) == 1
        assert holdings[0]["quantity"] == 10
        assert holdings[0]["currentPrice"] == 120.0

    @pytest.mark.asyncio
    async def test_get_transactions(self, test_session: AsyncSession) -> None:
        user_id, _, _ = await seed_full(test_session)
        service = PortfolioService(test_session)
        result = await service.get_transactions(user_id)
        assert result["total"] == 1
        assert len(result["transactions"]) == 1
        assert result["transactions"][0]["action"] == "buy"

    @pytest.mark.asyncio
    async def test_get_transactions_empty(self, test_session: AsyncSession) -> None:
        u = _user(uid="usr-empty")
        c = _company(cid="cmp-empty")
        p = _portfolio(uid="usr-empty")
        for obj in [u, c, p]:
            test_session.add(obj)
        await test_session.flush()
        service = PortfolioService(test_session)
        result = await service.get_transactions("usr-empty")
        assert result["total"] == 0
        assert len(result["transactions"]) == 0
