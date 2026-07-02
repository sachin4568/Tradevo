"""DecisionTimeline event subscriber.

Creates a DecisionTimeline entry whenever a TradeExecuted event
is emitted. This keeps the portfolio module decoupled from the
AI module — the hook is registered at the application layer.

Usage in main.py or router init:
    from app.modules.ai.decision_hook import create_decision_timeline_hook
    trade_service.register_event_hook(create_decision_timeline_hook(db))
"""

import logging

from app.core.utils import generate_entity_id
from app.modules.ai.repository import DecisionTimelineRepository

logger = logging.getLogger(__name__)


def create_decision_timeline_hook(db):
    """Factory that creates a TradeExecuted event subscriber.

    The returned function creates a DecisionTimeline entry in the
    AI module's table. It receives the DB session via closure so
    it can use the same transaction context as the trade execution.

    Args:
        db: AsyncSession from the current request context.

    Returns:
        Async callable compatible with TradeExecutionService event hooks.
    """

    async def on_trade_executed(event) -> None:
        """Create a DecisionTimeline entry for a completed trade."""
        try:
            repo = DecisionTimelineRepository(db)
            await repo.create(
                timeline_id=generate_entity_id("dtl"),
                user_id=event.user_id,
                company_id=event.company_id,
                decision_type=event.transaction_type,  # BUY or SELL
                user_action=event.transaction_type.lower(),  # buy or sell
                transaction_id=event.transaction_id,
            )
            logger.debug(
                "DecisionTimeline created: user=%s txn=%s company=%s",
                event.user_id,
                event.transaction_id,
                event.company_id,
            )
        except Exception:
            logger.exception(
                "Failed to create DecisionTimeline for txn=%s",
                event.transaction_id,
            )

    return on_trade_executed
