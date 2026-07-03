"""Portfolio domain entities (ENT-002, ENT-003, Holding).

Portfolio: User's virtual investment account (cash balance, metadata).
Holding: Current position in a specific company (quantity, average price).
Transaction: Immutable record of every buy/sell operation.

Per user revision #1 (Milestone 3):
- Holding is a dedicated table, NOT a JSONB column in Portfolio.
- Holdings represent current state; transactions are immutable history.
- Trade execution atomically updates Portfolio + Holding + Transaction.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class Portfolio(Base):
    """User's virtual investment portfolio.

    Created on registration with 10,00,000 virtual cash (BR-005).
    Stores only portfolio-level state (cash, metadata).
    Holdings are stored in the dedicated 'holdings' table.
    """

    __tablename__ = "portfolios"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    virtual_cash: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=1000000.00,
    )
    total_invested: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=0,
    )
    total_returns: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=0,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )


class Holding(Base):
    """Current position in a specific company.

    One row per (portfolio, company) pair. Updated atomically
    alongside Portfolio and Transaction during trade execution.

    When quantity reaches zero (full sell), the row is deleted.
    """

    __tablename__ = "holdings"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    portfolio_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(
        Numeric(12, 0),
        nullable=False,
        default=0,
    )
    average_price: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )


class Transaction(Base):
    """Immutable record of a buy or sell operation.

    Transactions are the source of truth for trade history.
    Holdings are derived state maintained atomically during
    trade execution — they are NOT derived from transactions
    on every request.
    """

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    portfolio_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("companies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    transaction_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )  # "BUY" or "SELL"
    quantity: Mapped[int] = mapped_column(
        Numeric(12, 0),
        nullable=False,
    )
    price: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    total: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="COMPLETED",
    )  # COMPLETED, CANCELLED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
