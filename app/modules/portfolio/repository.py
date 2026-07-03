"""Portfolio domain data access layer.

PortfolioRepository: portfolio CRUD and cash management.
HoldingRepository: current position queries and atomic updates.
TransactionRepository: immutable trade history queries and insertion.

All repositories follow the constructor-injected AsyncSession pattern.
Transaction boundaries (commit/rollback) are managed at the service layer.
Repositories use flush() to make changes visible within the session
without committing.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.portfolio.models import Holding, Portfolio, Transaction


class PortfolioRepository:
    """Data access for the Portfolio entity."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_user_id(self, user_id: str) -> Portfolio | None:
        """Fetch a portfolio by the owning user's ID."""
        result = await self.db.execute(
            select(Portfolio).where(Portfolio.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, portfolio_id: str) -> Portfolio | None:
        """Fetch a portfolio by primary key."""
        result = await self.db.execute(
            select(Portfolio).where(Portfolio.id == portfolio_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        portfolio_id: str,
        user_id: str,
        virtual_cash: float = 1_000_000.00,
    ) -> Portfolio:
        """Create a new portfolio for a user (BR-005: initial capital)."""
        now = datetime.now(UTC)
        portfolio = Portfolio(
            id=portfolio_id,
            user_id=user_id,
            virtual_cash=virtual_cash,
            created_at=now,
            updated_at=now,
        )
        self.db.add(portfolio)
        await self.db.flush()
        return portfolio

    async def update_cash(self, portfolio_id: str, new_cash: float) -> None:
        """Set the portfolio's virtual cash balance.

        The new_cash value must be pre-computed by the service layer.
        This is called within a database transaction.
        """
        portfolio = await self.get_by_id(portfolio_id)
        if portfolio is not None:
            portfolio.virtual_cash = new_cash
            await self.db.flush()

    async def update_investment_totals(
        self,
        portfolio_id: str,
        total_invested: float,
        total_returns: float,
    ) -> None:
        """Update the portfolio's investment tracking totals."""
        portfolio = await self.get_by_id(portfolio_id)
        if portfolio is not None:
            portfolio.total_invested = total_invested
            portfolio.total_returns = total_returns
            await self.db.flush()


class HoldingRepository:
    """Data access for the Holding entity.

    Holdings represent the current portfolio state — NOT derived from
    transaction history. They are updated atomically during trade execution.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_portfolio_and_company(
        self,
        portfolio_id: str,
        company_id: str,
    ) -> Holding | None:
        """Fetch a holding for a specific (portfolio, company) pair."""
        result = await self.db.execute(
            select(Holding).where(
                Holding.portfolio_id == portfolio_id,
                Holding.company_id == company_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_portfolio(self, portfolio_id: str) -> list[Holding]:
        """List all holdings for a portfolio."""
        result = await self.db.execute(
            select(Holding)
            .where(Holding.portfolio_id == portfolio_id)
            .order_by(Holding.company_id)
        )
        return list(result.scalars().all())

    async def create(
        self,
        holding_id: str,
        portfolio_id: str,
        company_id: str,
        quantity: int,
        average_price: float,
    ) -> Holding:
        """Create a new holding (first purchase of a company)."""
        now = datetime.now(UTC)
        holding = Holding(
            id=holding_id,
            portfolio_id=portfolio_id,
            company_id=company_id,
            quantity=quantity,
            average_price=average_price,
            last_updated=now,
        )
        self.db.add(holding)
        await self.db.flush()
        return holding

    async def update_holding(
        self,
        holding: Holding,
        *,
        quantity: int,
        average_price: float,
    ) -> Holding:
        """Update an existing holding's quantity and average price."""
        holding.quantity = quantity
        holding.average_price = average_price
        holding.last_updated = datetime.now(UTC)
        await self.db.flush()
        return holding

    async def delete_holding(self, holding: Holding) -> None:
        """Delete a holding (when quantity reaches zero from a full sell)."""
        await self.db.delete(holding)
        await self.db.flush()


class TransactionRepository:
    """Data access for the Transaction entity.

    Transactions are immutable history records. Once created, they
    are never modified. Only insertion and read operations exist.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        transaction_id: str,
        portfolio_id: str,
        company_id: str,
        transaction_type: str,
        quantity: int,
        price: float,
        total: float,
        status: str = "COMPLETED",
    ) -> Transaction:
        """Record a new transaction (immutable once created)."""
        now = datetime.now(UTC)
        txn = Transaction(
            id=transaction_id,
            portfolio_id=portfolio_id,
            company_id=company_id,
            transaction_type=transaction_type,
            quantity=quantity,
            price=price,
            total=total,
            status=status,
            created_at=now,
        )
        self.db.add(txn)
        await self.db.flush()
        return txn

    async def list_by_portfolio(
        self,
        portfolio_id: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Transaction]:
        """List transactions for a portfolio, newest first."""
        result = await self.db.execute(
            select(Transaction)
            .where(Transaction.portfolio_id == portfolio_id)
            .order_by(Transaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def count_by_portfolio(self, portfolio_id: str) -> int:
        """Count total transactions for a portfolio."""
        from sqlalchemy import func

        result = await self.db.execute(
            select(func.count(Transaction.id)).where(
                Transaction.portfolio_id == portfolio_id
            )
        )
        return result.scalar_one() or 0

    async def get_by_id(self, transaction_id: str) -> Transaction | None:
        """Fetch a single transaction by ID."""
        result = await self.db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        )
        return result.scalar_one_or_none()
