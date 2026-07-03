"""Shared test fixtures for the Tradevo test suite.

Provides:
- Test database engine and session (SQLite in-memory for speed)
- Test FastAPI client with dependency overrides
- Factory functions for creating test data
"""

import asyncio
from collections.abc import AsyncGenerator, Generator
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.dependencies import get_db_session
from app.main import app
from app.modules.auth.models import User
from app.modules.market.models import Company
from app.modules.portfolio.models import Portfolio

_NOW = datetime(2026, 6, 29, 12, 0, tzinfo=UTC)


def _make_user(uid: str = "usr-seed1", name: str = "Test User", email: str = "test@test.com") -> User:
    return User(
        id=uid, name=name, email=email, password_hash="hashed_pw",
        experience_level="beginner", risk_preference="moderate",
        created_at=_NOW, updated_at=_NOW,
    )


def _make_company(cid: str = "cmp-seed1", symbol: str = "SEED1", name: str = "Seed Corp") -> Company:
    return Company(
        id=cid, name=name, symbol=symbol, sector="IT",
        industry="Software", exchange="NSE", market_cap="1,00,000 Cr",
        current_price=1500.0, previous_close=1480.0, day_change=20.0,
        day_change_percent=1.35, volume=50000, pe=25.0, pb=5.0,
        dividend_yield=1.0, week52_high=1800.0, week52_low=1000.0,
        description="A seed company for testing.", website="https://seed.test",
        founded_year=2010, employees=5000,
        revenue=50000.0, net_profit=10000.0, debt=5000.0, cash_flow=12000.0,
        roe=20.0, roa=10.0, promotor_holding=50.0,
        institutional_holding=30.0, public_holding=20.0,
        created_at=_NOW, updated_at=_NOW,
    )


@pytest.fixture
async def seed_user(test_session: AsyncSession) -> User:
    """Create and return a seeded user."""
    user = _make_user()
    test_session.add(user)
    await test_session.flush()
    return user


@pytest.fixture
async def seed_company(test_session: AsyncSession) -> Company:
    """Create and return a seeded company."""
    company = _make_company()
    test_session.add(company)
    await test_session.flush()
    return company


@pytest.fixture
async def seed_portfolio(test_session: AsyncSession, seed_user: User) -> Portfolio:
    """Create and return a seeded portfolio for the seed user."""
    portfolio = Portfolio(
        id="pfl-seed1", user_id=seed_user.id, virtual_cash=1_000_000.0,
        total_invested=0, total_returns=0,
        created_at=_NOW, updated_at=_NOW,
    )
    test_session.add(portfolio)
    await test_session.flush()
    return portfolio


@pytest.fixture
async def create_user(test_session: AsyncSession):
    """Factory fixture to create additional users."""
    created_users = []

    async def _create(email: str, name: str, uid: str | None = None) -> User:
        if uid is None:
            uid = f"usr-{len(created_users) + 100}"
        user = _make_user(uid=uid, name=name, email=email)
        test_session.add(user)
        await test_session.flush()
        created_users.append(user)
        return user

    return _create


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine (SQLite in-memory).

    Uses SQLite for test speed. All models are created on setup
    and dropped on teardown.
    """
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async def setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def teardown():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(setup())
    yield engine
    asyncio.run(teardown())


@pytest.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a fresh database session per test with auto-rollback."""
    session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_client(test_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an authenticated test client with dependency overrides."""

    async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield test_session

    app.dependency_overrides[get_db_session] = override_get_db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
