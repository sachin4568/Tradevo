"""TradeExecutionService — atomic trade orchestration.

Coordinates MarketProvider, PortfolioRepository, HoldingRepository,
and TransactionRepository to execute buy/sell operations within a
single database transaction.

Per user revisions for Milestone 3:
- Frontend sends ONLY companyId + quantity (revision #4).
- Backend fetches execution price from MarketProvider (revision #4).
- Atomic update of Portfolio + Holding + Transaction (revision #3).
- Returns TradeResult with all updated state (revision #6).
- Pre-execution validation (revision #7).
- Emits TradeExecuted domain event (revision #8).

Transactions are immutable history. Holdings are current state.
"""

import logging
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DomainError,
    InsufficientFundsError,
    InsufficientSharesError,
    MarketDataUnavailableError,
    NotFoundError,
)
from app.core.utils import generate_entity_id
from app.integrations.market.base import MarketProvider
from app.modules.market.repository import CompanyRepository
from app.modules.portfolio.events import TradeExecuted
from app.modules.portfolio.models import Holding, Portfolio, Transaction
from app.modules.portfolio.repository import (
    HoldingRepository,
    PortfolioRepository,
    TransactionRepository,
)

logger = logging.getLogger(__name__)


@dataclass
class TradeResult:
    """Composite result returned after a successful trade execution.

    Contains the recorded transaction, updated portfolio state,
    updated (or new) holding, and remaining cash — all in one
    response so the frontend can update its state atomically.
    """

    transaction: dict
    portfolio: dict
    holding: dict | None
    remainingCash: float
    event: TradeExecuted = field(default_factory=TradeExecuted)


class TradeExecutionService:
    """Orchestrates buy and sell operations across multiple repositories.

    Each trade execution is an atomic unit of work:
    1. Validate preconditions (company exists, is tradable, price available)
    2. Fetch execution price from MarketProvider
    3. Validate business rules (sufficient cash/shares)
    4. Create Transaction record
    5. Update Holding (create, update, or delete)
    6. Update Portfolio cash
    7. Commit all changes in a single DB transaction
    8. Emit TradeExecuted domain event
    """

    def __init__(
        self,
        db: AsyncSession,
        market_provider: MarketProvider,
    ) -> None:
        self.db = db
        self.portfolio_repo = PortfolioRepository(db)
        self.holding_repo = HoldingRepository(db)
        self.transaction_repo = TransactionRepository(db)
        self.company_repo = CompanyRepository(db)
        self.market_provider = market_provider
        self._event_hooks: list = []

    def register_event_hook(self, hook) -> None:
        """Register a callback to be invoked after successful trade execution.

        The hook receives a TradeExecuted event. Multiple hooks can be
        registered. Hooks are called in registration order.

        This supports future integration with AI, notifications, and
        learning modules without coupling them to the trade execution logic.
        """
        self._event_hooks.append(hook)

    async def execute_buy(
        self,
        user_id: str,
        company_id: str,
        quantity: int,
    ) -> TradeResult:
        """Execute a BUY operation atomically.

        Steps:
        1. Validate quantity > 0
        2. Verify company exists
        3. Fetch current price from MarketProvider
        4. Verify price is available and > 0
        5. Verify portfolio exists and has sufficient cash
        6. Create Transaction record
        7. Create or update Holding
        8. Deduct cash from Portfolio
        9. Commit
        10. Emit TradeExecuted event

        Returns:
            TradeResult with transaction, updated portfolio, holding, and remaining cash.

        Raises:
            DomainError: If quantity <= 0.
            NotFoundError: If company or portfolio not found.
            MarketDataUnavailableError: If price is not available.
            InsufficientFundsError: If insufficient cash.
        """
        # Validation #1: quantity > 0
        if quantity <= 0:
            raise DomainError(
                message="Quantity must be greater than 0",
                error_code="INVALID_QUANTITY",
            )

        # Validation #2: company exists
        company = await self.company_repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")

        # Validation #3 & #4: fetch price from MarketProvider (NOT from frontend)
        price_data = await self.market_provider.get_company_price(company.symbol)
        execution_price = float(price_data.price)

        if execution_price <= 0:
            raise MarketDataUnavailableError(
                message=f"Market price not available for {company.symbol}"
            )

        # Validation #5: portfolio exists
        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            raise NotFoundError(message="Portfolio not found. Please register first.")

        total_cost = execution_price * quantity
        current_cash = float(portfolio.virtual_cash)

        if total_cost > current_cash:
            raise InsufficientFundsError(
                message=f"Insufficient virtual cash. Need ₹{total_cost:,.2f}, have ₹{current_cash:,.2f}."
            )

        # Execute atomically within the existing session/transaction
        # Step A: Record the transaction
        txn = await self.transaction_repo.create(
            transaction_id=generate_entity_id("txn"),
            portfolio_id=portfolio.id,
            company_id=company_id,
            transaction_type="BUY",
            quantity=quantity,
            price=execution_price,
            total=total_cost,
        )

        # Step B: Create or update holding
        holding = await self.holding_repo.get_by_portfolio_and_company(
            portfolio.id, company_id
        )

        if holding is None:
            # First purchase of this company
            holding = await self.holding_repo.create(
                holding_id=generate_entity_id("hld"),
                portfolio_id=portfolio.id,
                company_id=company_id,
                quantity=quantity,
                average_price=execution_price,
            )
        else:
            # Add to existing position, recalculate average price
            old_qty = int(holding.quantity)
            old_avg = float(holding.average_price)
            new_qty = old_qty + quantity
            new_avg = (old_avg * old_qty + execution_price * quantity) / new_qty
            holding = await self.holding_repo.update_holding(
                holding, quantity=new_qty, average_price=round(new_avg, 2)
            )

        # Step C: Deduct cash from portfolio
        new_cash = current_cash - total_cost
        await self.portfolio_repo.update_cash(portfolio.id, new_cash)

        # Step D: Update investment totals
        new_total_invested = float(portfolio.total_invested) + total_cost
        await self.portfolio_repo.update_investment_totals(
            portfolio.id,
            total_invested=new_total_invested,
            total_returns=float(portfolio.total_returns),
        )

        # Commit all changes atomically
        await self.db.commit()

        # Refresh portfolio to get updated state
        await self.db.refresh(portfolio)

        # Build the domain event
        event = TradeExecuted(
            transaction_id=txn.id,
            portfolio_id=portfolio.id,
            user_id=user_id,
            company_id=company_id,
            transaction_type="BUY",
            quantity=quantity,
            price=execution_price,
            total=total_cost,
            remaining_cash=float(portfolio.virtual_cash),
        )

        # Emit to registered hooks (non-blocking, no subscribers yet)
        await self._emit_event(event)

        logger.info(
            "Buy executed: user=%s company=%s qty=%d price=%.2f total=%.2f cash=%.2f",
            user_id,
            company_id,
            quantity,
            execution_price,
            total_cost,
            float(portfolio.virtual_cash),
        )

        return TradeResult(
            transaction=self._transaction_to_dict(txn, company),
            portfolio=self._portfolio_to_dict(portfolio),
            holding=self._holding_to_dict(holding, company),
            remainingCash=float(portfolio.virtual_cash),
            event=event,
        )

    async def execute_sell(
        self,
        user_id: str,
        company_id: str,
        quantity: int,
    ) -> TradeResult:
        """Execute a SELL operation atomically.

        Steps:
        1. Validate quantity > 0
        2. Verify company exists
        3. Fetch current price from MarketProvider
        4. Verify price is available and > 0
        5. Verify portfolio exists
        6. Verify holding exists with sufficient shares
        7. Create Transaction record
        8. Update or delete Holding
        9. Add proceeds to Portfolio cash
        10. Commit
        11. Emit TradeExecuted event

        Returns:
            TradeResult with transaction, updated portfolio, holding, and remaining cash.

        Raises:
            DomainError: If quantity <= 0.
            NotFoundError: If company, portfolio, or holding not found.
            InsufficientSharesError: If not enough shares to sell.
            MarketDataUnavailableError: If price is not available.
        """
        # Validation #1: quantity > 0
        if quantity <= 0:
            raise DomainError(
                message="Quantity must be greater than 0",
                error_code="INVALID_QUANTITY",
            )

        # Validation #2: company exists
        company = await self.company_repo.get_by_id(company_id)
        if company is None:
            raise NotFoundError(message="Company not found")

        # Validation #3 & #4: fetch price from MarketProvider
        price_data = await self.market_provider.get_company_price(company.symbol)
        execution_price = float(price_data.price)

        if execution_price <= 0:
            raise MarketDataUnavailableError(
                message=f"Market price not available for {company.symbol}"
            )

        # Validation #5: portfolio exists
        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            raise NotFoundError(message="Portfolio not found. Please register first.")

        # Validation #6: holding exists with sufficient shares
        holding = await self.holding_repo.get_by_portfolio_and_company(
            portfolio.id, company_id
        )
        if holding is None:
            raise InsufficientSharesError(
                message="No holdings found for this company."
            )

        current_qty = int(holding.quantity)
        if current_qty < quantity:
            raise InsufficientSharesError(
                message=f"Insufficient holdings. You have {current_qty} shares but tried to sell {quantity}."
            )

        total_proceeds = execution_price * quantity

        # Execute atomically
        # Step A: Record the transaction
        txn = await self.transaction_repo.create(
            transaction_id=generate_entity_id("txn"),
            portfolio_id=portfolio.id,
            company_id=company_id,
            transaction_type="SELL",
            quantity=quantity,
            price=execution_price,
            total=total_proceeds,
        )

        # Step B: Update or delete holding
        new_qty = current_qty - quantity

        holding_result: dict | None = None

        if new_qty == 0:
            # Full sell — remove the holding
            await self.holding_repo.delete_holding(holding)
            holding_result = None
        else:
            # Partial sell — quantity changes, average_price stays the same
            holding = await self.holding_repo.update_holding(
                holding, quantity=new_qty, average_price=float(holding.average_price)
            )
            holding_result = self._holding_to_dict(holding, company)

        # Step C: Add proceeds to portfolio cash
        new_cash = float(portfolio.virtual_cash) + total_proceeds
        await self.portfolio_repo.update_cash(portfolio.id, new_cash)

        # Step D: Update investment totals
        invested = float(portfolio.total_invested)
        returns = float(portfolio.total_returns) + total_proceeds
        await self.portfolio_repo.update_investment_totals(
            portfolio.id,
            total_invested=invested,
            total_returns=returns,
        )

        # Commit all changes atomically
        await self.db.commit()

        # Refresh portfolio to get updated state
        await self.db.refresh(portfolio)

        # Build the domain event
        event = TradeExecuted(
            transaction_id=txn.id,
            portfolio_id=portfolio.id,
            user_id=user_id,
            company_id=company_id,
            transaction_type="SELL",
            quantity=quantity,
            price=execution_price,
            total=total_proceeds,
            remaining_cash=float(portfolio.virtual_cash),
        )

        # Emit to registered hooks
        await self._emit_event(event)

        logger.info(
            "Sell executed: user=%s company=%s qty=%d price=%.2f total=%.2f cash=%.2f",
            user_id,
            company_id,
            quantity,
            execution_price,
            total_proceeds,
            float(portfolio.virtual_cash),
        )

        return TradeResult(
            transaction=self._transaction_to_dict(txn, company),
            portfolio=self._portfolio_to_dict(portfolio),
            holding=holding_result,
            remainingCash=float(portfolio.virtual_cash),
            event=event,
        )

    async def _emit_event(self, event: TradeExecuted) -> None:
        """Invoke all registered event hooks.

        Hooks are called sequentially. Errors in hooks are caught and
        logged but do not affect the trade result (fire-and-forget).
        """
        for hook in self._event_hooks:
            try:
                if callable(hook):
                    result = hook(event)
                    if hasattr(result, "__await__"):
                        await result
            except Exception:
                logger.exception("Event hook failed for event %s", event.event_type)

    # ─── Dict Converters (camelCase for frontend) ───

    @staticmethod
    def _transaction_to_dict(txn: Transaction, company) -> dict:
        """Convert Transaction model to camelCase dict matching frontend Transaction type."""
        return {
            "id": txn.id,
            "companyId": txn.company_id,
            "action": txn.transaction_type.lower(),  # "buy" / "sell"
            "quantity": int(txn.quantity),
            "price": float(txn.price),
            "total": float(txn.total),
            "timestamp": txn.created_at.isoformat() if txn.created_at else "",
            "status": txn.status,
        }

    @staticmethod
    def _portfolio_to_dict(p: Portfolio) -> dict:
        """Convert Portfolio model to camelCase dict."""
        return {
            "id": p.id,
            "userId": p.user_id,
            "virtualCash": float(p.virtual_cash),
            "totalInvested": float(p.total_invested),
            "totalReturns": float(p.total_returns),
            "createdAt": p.created_at.isoformat() if p.created_at else "",
            "updatedAt": p.updated_at.isoformat() if p.updated_at else "",
        }

    @staticmethod
    def _holding_to_dict(h: Holding, company) -> dict:
        """Convert Holding model to camelCase dict matching frontend Holding type."""
        return {
            "id": h.id,
            "companyId": h.company_id,
            "companyName": company.name if company else "",
            "symbol": company.symbol if company else "",
            "sector": company.sector if company else "",
            "quantity": int(h.quantity),
            "avgPrice": float(h.average_price),
            "currentPrice": float(company.current_price) if company else 0,
            "lastUpdated": h.last_updated.isoformat() if h.last_updated else "",
        }
