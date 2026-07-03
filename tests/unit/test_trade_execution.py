"""Unit tests for TradeExecutionService.

Tests atomic trade orchestration: buy and sell operations
with pre-execution validation, holding updates, and cash management.
Uses SQLite in-memory with savepoint-based isolation.
"""

from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.core.exceptions import (
    DomainError,
    InsufficientFundsError,
    InsufficientSharesError,
    NotFoundError,
)
from app.integrations.market.base import PriceData
from app.modules.auth.models import User
from app.modules.market.models import Company
from app.modules.portfolio.models import Portfolio
from app.modules.portfolio.trade_service import TradeExecutionService

_NOW = datetime(2026, 6, 29, 12, 0, tzinfo=UTC)


# ─── Custom fixture with savepoint isolation ───
# TradeExecutionService calls db.commit(), so we need
# nested transactions (savepoints) for test isolation.


@pytest.fixture
async def trade_engine():
    """Create a fresh in-memory database per test for trade execution tests.

    TradeExecutionService calls db.commit(), so we need a fresh database
    per test to ensure full isolation.
    """
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def trade_session(trade_engine) -> AsyncGenerator[AsyncSession, None]:
    """Session for trade tests backed by a per-test in-memory database."""
    session_factory = async_sessionmaker(
        trade_engine, class_=AsyncSession, expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


def make_user(user_id: str = "usr-trade1") -> User:
    return User(
        id=user_id, name="Trader", email="trader@test.com",
        password_hash="hash", experience_level="beginner",
        risk_preference="moderate", created_at=_NOW, updated_at=_NOW,
    )


def make_company(company_id: str = "cmp-trade1", price: float = 100.0) -> Company:
    return Company(
        id=company_id, name="Trade Co Ltd", symbol="TRADECO",
        sector="IT", industry="IT", exchange="NSE", market_cap="1L Cr",
        current_price=price, previous_close=price - 1, day_change=1.0,
        day_change_percent=1.0, volume=100000, pe=25.0, pb=5.0,
        dividend_yield=1.0, week52_high=120.0, week52_low=80.0,
        description="Test.", website="t.com", founded_year=2000,
        employees=1000, revenue=50000, net_profit=10000, debt=0,
        cash_flow=12000, roe=20.0, roa=10.0, promotor_holding=50.0,
        institutional_holding=30.0, public_holding=20.0,
        created_at=_NOW, updated_at=_NOW,
    )


def make_portfolio(user_id: str = "usr-trade1", cash: float = 1_000_000.0) -> Portfolio:
    return Portfolio(
        id="pfl-trade1", user_id=user_id, virtual_cash=cash,
        total_invested=0, total_returns=0,
        created_at=_NOW, updated_at=_NOW,
    )


def mock_market_provider(price: float = 100.0):
    """Create a mock MarketProvider that returns a fixed price."""
    provider = AsyncMock()
    provider.get_company_price.return_value = PriceData(
        symbol="TRADECO", price=Decimal(str(price)),
        change=Decimal("1.0"), change_percent=Decimal("1.0"),
        timestamp=_NOW.isoformat(),
    )
    return provider


async def seed_trade_data(
    session: AsyncSession, *, price: float = 100.0, cash: float = 1_000_000.0
) -> tuple[str, str, str]:
    """Seed user, company, and portfolio. Returns (user_id, company_id, portfolio_id)."""
    u = make_user()
    c = make_company(price=price)
    p = make_portfolio(cash=cash)
    session.add(u)
    session.add(c)
    session.add(p)
    await session.flush()
    return u.id, c.id, p.id


class TestTradeExecutionServiceBuy:
    """Tests for the execute_buy method."""

    @pytest.mark.asyncio
    async def test_buy_creates_transaction(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        result = await service.execute_buy(user_id, company_id, 10)
        assert result.transaction["action"] == "buy"
        assert result.transaction["quantity"] == 10
        assert result.transaction["price"] == 100.0
        assert result.transaction["total"] == 1000.0

    @pytest.mark.asyncio
    async def test_buy_creates_holding(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        result = await service.execute_buy(user_id, company_id, 10)
        assert result.holding is not None
        assert result.holding["quantity"] == 10
        assert result.holding["avgPrice"] == 100.0

    @pytest.mark.asyncio
    async def test_buy_deducts_cash(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session, cash=50000.0)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        result = await service.execute_buy(user_id, company_id, 10)
        assert result.remainingCash == 49000.0

    @pytest.mark.asyncio
    async def test_buy_accumulates_holding(self, trade_session: AsyncSession) -> None:
        """Second buy of same company should update average price."""
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        # First buy: 10 @ 100
        await service.execute_buy(user_id, company_id, 10)

        # Second buy: 10 @ 120 (change mock price)
        provider.get_company_price.return_value = PriceData(
            symbol="TRADECO", price=Decimal("120"),
            change=Decimal("20"), change_percent=Decimal("20"),
            timestamp=_NOW.isoformat(),
        )
        result = await service.execute_buy(user_id, company_id, 10)

        # Average should be (10*100 + 10*120) / 20 = 110
        assert result.holding is not None
        assert result.holding["quantity"] == 20
        assert result.holding["avgPrice"] == 110.0

    @pytest.mark.asyncio
    async def test_buy_insufficient_funds(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session, cash=50.0)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(InsufficientFundsError):
            await service.execute_buy(user_id, company_id, 1)

    @pytest.mark.asyncio
    async def test_buy_company_not_found(self, trade_session: AsyncSession) -> None:
        user_id, _, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(NotFoundError):
            await service.execute_buy(user_id, "cmp-nonexistent", 1)

    @pytest.mark.asyncio
    async def test_buy_portfolio_not_found(self, trade_session: AsyncSession) -> None:
        """Buy should fail if user has no portfolio."""
        u = make_user(user_id="usr-nopfl")
        c = make_company(company_id="cmp-trade1")
        trade_session.add(u)
        trade_session.add(c)
        await trade_session.flush()
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(NotFoundError, match="Portfolio not found"):
            await service.execute_buy("usr-nopfl", "cmp-trade1", 1)

    @pytest.mark.asyncio
    async def test_buy_zero_quantity_rejected(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(DomainError, match="greater than 0"):
            await service.execute_buy(user_id, company_id, 0)

    @pytest.mark.asyncio
    async def test_buy_emits_trade_executed_event(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        events_received: list = []
        service.register_event_hook(lambda e: events_received.append(e))

        await service.execute_buy(user_id, company_id, 5)
        assert len(events_received) == 1
        assert events_received[0].event_type == "trade.executed"
        assert events_received[0].transaction_type == "BUY"
        assert events_received[0].quantity == 5


class TestTradeExecutionServiceSell:
    """Tests for the execute_sell method."""

    @pytest.mark.asyncio
    async def test_sell_creates_transaction(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        # First buy 10 shares
        await service.execute_buy(user_id, company_id, 10)

        # Now sell 5
        result = await service.execute_sell(user_id, company_id, 5)
        assert result.transaction["action"] == "sell"
        assert result.transaction["quantity"] == 5

    @pytest.mark.asyncio
    async def test_sell_adds_cash(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        await service.execute_buy(user_id, company_id, 10)
        result = await service.execute_sell(user_id, company_id, 5)
        # Started with 1M, spent 1000 on buy, got 500 back on sell
        assert result.remainingCash == 999500.0

    @pytest.mark.asyncio
    async def test_sell_partial_keeps_holding(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        await service.execute_buy(user_id, company_id, 10)
        result = await service.execute_sell(user_id, company_id, 5)
        assert result.holding is not None
        assert result.holding["quantity"] == 5
        assert result.holding["avgPrice"] == 100.0  # avg price unchanged on sell

    @pytest.mark.asyncio
    async def test_sell_full_deletes_holding(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        await service.execute_buy(user_id, company_id, 10)
        result = await service.execute_sell(user_id, company_id, 10)
        assert result.holding is None

    @pytest.mark.asyncio
    async def test_sell_no_holding_raises_error(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(InsufficientSharesError, match="No holdings"):
            await service.execute_sell(user_id, company_id, 1)

    @pytest.mark.asyncio
    async def test_sell_insufficient_shares(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)

        await service.execute_buy(user_id, company_id, 5)
        with pytest.raises(InsufficientSharesError, match="Insufficient holdings"):
            await service.execute_sell(user_id, company_id, 10)

    @pytest.mark.asyncio
    async def test_sell_zero_quantity_rejected(self, trade_session: AsyncSession) -> None:
        user_id, company_id, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(DomainError, match="greater than 0"):
            await service.execute_sell(user_id, company_id, 0)

    @pytest.mark.asyncio
    async def test_sell_company_not_found(self, trade_session: AsyncSession) -> None:
        user_id, _, _ = await seed_trade_data(trade_session)
        provider = mock_market_provider(100.0)
        service = TradeExecutionService(trade_session, market_provider=provider)
        with pytest.raises(NotFoundError):
            await service.execute_sell(user_id, "cmp-nonexistent", 1)
