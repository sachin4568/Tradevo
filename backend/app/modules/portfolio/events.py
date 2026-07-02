"""Domain event types for the portfolio module.

Lightweight dataclasses that represent business events. These are
emitted after successful operations and can be consumed by subscribers
(AI, notifications, learning modules) in later milestones.

Currently ONLY the event definitions exist — no subscribers are
implemented. The TradeExecuted event is emitted by TradeExecutionService
after every successful buy/sell operation.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class TradeExecuted:
    """Emitted after a successful buy or sell operation.

    Attributes:
        event_type: Discriminator ("trade.executed").
        transaction_id: The recorded transaction's ID.
        portfolio_id: The portfolio that executed the trade.
        user_id: The user who owns the portfolio.
        company_id: The company being traded.
        transaction_type: "BUY" or "SELL".
        quantity: Number of shares traded.
        price: Execution price per share.
        total: Total value (quantity * price).
        remaining_cash: Portfolio cash after the trade.
        timestamp: When the trade was executed.
    """

    event_type: str = "trade.executed"
    transaction_id: str = ""
    portfolio_id: str = ""
    user_id: str = ""
    company_id: str = ""
    transaction_type: str = ""
    quantity: int = 0
    price: float = 0.0
    total: float = 0.0
    remaining_cash: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
