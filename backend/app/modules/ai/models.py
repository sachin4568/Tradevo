"""AI domain entity (ENT-007: DecisionTimeline).

Records every investment decision a user makes. Created automatically
by a subscriber to the TradeExecuted domain event.

JSON fields use a versioned structure (revision #2):
  { "version": 1, "data": { ... } }

This entity lives in the AI module because it serves as the
foundation for all AI behavioral analysis in later milestones.
The learning and portfolio modules never import this model directly.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class DecisionTimeline(Base):
    """Records every investment decision for AI behavioral analysis.

    Created by the TradeExecuted event subscriber after every
    successful buy/sell operation. AI-enrichment fields are nullable
    and will be populated in Milestones 7 and 8.
    """

    __tablename__ = "decision_timelines"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_id: Mapped[str | None] = mapped_column(
        String(24),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    decision_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )  # BUY, SELL, HOLD
    company_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    decision_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
    user_action: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )  # buy, sell, hold

    # AI-enrichment fields (Milestone 7+)
    # Revision #2: Versioned JSON structure
    ai_feedback: Mapped[dict | None] = mapped_column(
        "ai_feedback",
        # Using Text to store JSON as text (versioned structure)
        # Actual type will be JSON for PostgreSQL
        String,
        nullable=True,
    )
    market_context: Mapped[dict | None] = mapped_column(
        "market_context",
        String,
        nullable=True,
    )

    # AI outcome scoring (Milestone 8+)
    investment_outcome: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )  # gain, loss, neutral
    outcome_score: Mapped[float | None] = mapped_column(
        Numeric(6, 2),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
