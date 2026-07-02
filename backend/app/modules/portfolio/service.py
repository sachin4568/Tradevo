"""PortfolioService — portfolio read operations and AI orchestration.

Handles portfolio summary, holdings listing, and transaction history.
Trade execution is handled by TradeExecutionService.

AI orchestration methods (Milestone 7.1):
- get_ai_dna: Investment DNA analysis via AI engine
- get_ai_observations: Portfolio observations via AI engine
- get_ai_trade_feedback: Post-trade educational feedback via AI engine

These methods encapsulate the data-fetching + AI engine call pattern
that was previously in the intelligence API endpoint.
"""

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.market.repository import CompanyRepository
from app.modules.portfolio.repository import (
    HoldingRepository,
    PortfolioRepository,
    TransactionRepository,
)

logger = logging.getLogger(__name__)


class PortfolioService:
    """Portfolio read operations and AI-enhanced analysis.

    Provides portfolio summary, holdings with live company data,
    and transaction history for display.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.portfolio_repo = PortfolioRepository(db)
        self.holding_repo = HoldingRepository(db)
        self.transaction_repo = TransactionRepository(db)
        self.company_repo = CompanyRepository(db)

    async def get_summary(self, user_id: str) -> dict:
        """Get the portfolio summary with holdings and computed metrics.

        Returns a dict matching the frontend's portfolio state:
        { virtualCash, totalInvested, totalReturns, holdings, holdingsValue, totalValue }

        Raises:
            NotFoundError: If user has no portfolio.
        """
        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            raise NotFoundError(message="Portfolio not found")

        holdings = await self.holding_repo.list_by_portfolio(portfolio.id)

        # Compute holdings value using current prices
        holdings_data = []
        holdings_value = 0.0

        for h in holdings:
            company = await self.company_repo.get_by_id(h.company_id)
            current_price = float(company.current_price) if company else 0.0
            position_value = current_price * int(h.quantity)
            holdings_value += position_value

            holdings_data.append({
                "id": h.id,
                "companyId": h.company_id,
                "companyName": company.name if company else "",
                "symbol": company.symbol if company else "",
                "sector": company.sector if company else "",
                "quantity": int(h.quantity),
                "avgPrice": float(h.average_price),
                "currentPrice": current_price,
                "investedValue": float(h.average_price) * int(h.quantity),
                "currentValue": position_value,
                "pnl": position_value - (float(h.average_price) * int(h.quantity)),
                "pnlPercent": self._calc_pnl_percent(
                    float(h.average_price), current_price
                ),
                "lastUpdated": h.last_updated.isoformat() if h.last_updated else "",
            })

        virtual_cash = float(portfolio.virtual_cash)
        total_value = virtual_cash + holdings_value
        total_invested = float(portfolio.total_invested)

        return {
            "id": portfolio.id,
            "userId": portfolio.user_id,
            "virtualCash": virtual_cash,
            "totalInvested": total_invested,
            "totalReturns": float(portfolio.total_returns),
            "holdings": holdings_data,
            "holdingsValue": round(holdings_value, 2),
            "totalValue": round(total_value, 2),
            "createdAt": portfolio.created_at.isoformat() if portfolio.created_at else "",
        }

    async def get_holdings(self, user_id: str) -> list[dict]:
        """Get holdings list for a portfolio.

        Returns holdings with company metadata and computed P&L.
        """
        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            raise NotFoundError(message="Portfolio not found")

        holdings = await self.holding_repo.list_by_portfolio(portfolio.id)
        result = []

        for h in holdings:
            company = await self.company_repo.get_by_id(h.company_id)
            current_price = float(company.current_price) if company else 0.0

            result.append({
                "id": h.id,
                "companyId": h.company_id,
                "companyName": company.name if company else "",
                "symbol": company.symbol if company else "",
                "sector": company.sector if company else "",
                "quantity": int(h.quantity),
                "avgPrice": float(h.average_price),
                "currentPrice": current_price,
                "investedValue": float(h.average_price) * int(h.quantity),
                "currentValue": current_price * int(h.quantity),
                "pnl": (current_price - float(h.average_price)) * int(h.quantity),
                "pnlPercent": self._calc_pnl_percent(
                    float(h.average_price), current_price
                ),
                "lastUpdated": h.last_updated.isoformat() if h.last_updated else "",
            })

        return result

    async def get_transactions(
        self,
        user_id: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """Get transaction history for a portfolio.

        Returns paginated transaction list with company metadata.
        """
        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            raise NotFoundError(message="Portfolio not found")

        transactions = await self.transaction_repo.list_by_portfolio(
            portfolio.id, limit=limit, offset=offset
        )
        total = await self.transaction_repo.count_by_portfolio(portfolio.id)

        tx_list = []
        for txn in transactions:
            company = await self.company_repo.get_by_id(txn.company_id)
            tx_list.append({
                "id": txn.id,
                "companyId": txn.company_id,
                "companyName": company.name if company else "",
                "symbol": company.symbol if company else "",
                "action": txn.transaction_type.lower(),
                "quantity": int(txn.quantity),
                "price": float(txn.price),
                "total": float(txn.total),
                "timestamp": txn.created_at.isoformat() if txn.created_at else "",
                "status": txn.status,
            })

        return {
            "transactions": tx_list,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    # ─── AI Orchestration (Milestone 7.1) ───

    async def get_ai_dna(self, user_id: str, user: Any) -> dict | None:
        """Generate Investment DNA analysis for a user.

        Orchestrates data fetching + AI engine call.  Returns the
        AIResponseEnvelope as a dict, or None if AI is unavailable.
        """
        from app.modules.ai.engines.services import (
            InvestmentDNAService,
            _get_request_manager,
        )
        from app.modules.ai.utils.helpers import envelope_to_api_dict

        rm = _get_request_manager()
        if rm is None:
            return None

        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            return None

        holdings = await self.holding_repo.list_by_portfolio(portfolio.id)
        transactions = await self.transaction_repo.list_by_portfolio(
            portfolio.id, limit=100
        )
        companies_by_id = await self._build_companies_map(holdings)

        service = InvestmentDNAService(rm)
        response = await service.analyse_behaviour(
            user=user,
            portfolio=portfolio,
            holdings=holdings,
            transactions=transactions,
            companies_by_id=companies_by_id,
        )

        if response is None:
            return None
        return envelope_to_api_dict(response)

    async def get_ai_observations(self, user_id: str) -> dict | None:
        """Generate portfolio observations for a user.

        Orchestrates data fetching + AI engine call.  Returns the
        AIResponseEnvelope as a dict, or None if AI is unavailable.
        """
        from app.modules.ai.engines.services import (
            DecisionIntelligenceService,
            _get_request_manager,
        )
        from app.modules.ai.utils.helpers import envelope_to_api_dict

        rm = _get_request_manager()
        if rm is None:
            return None

        portfolio = await self.portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            return None

        holdings = await self.holding_repo.list_by_portfolio(portfolio.id)
        transactions = await self.transaction_repo.list_by_portfolio(
            portfolio.id, limit=100
        )
        companies_by_id = await self._build_companies_map(holdings)

        service = DecisionIntelligenceService(rm)
        response = await service.get_portfolio_observations(
            portfolio=portfolio,
            holdings=holdings,
            transactions=transactions,
            companies_by_id=companies_by_id,
        )

        if response is None:
            return None
        return envelope_to_api_dict(response)

    async def get_ai_trade_feedback(
        self, user_id: str, transaction_id: str, user: Any
    ) -> dict | None:
        """Generate post-trade educational feedback.

        Orchestrates data fetching + AI engine call.  Returns the
        AIResponseEnvelope as a dict, or None if AI is unavailable.
        """
        from app.modules.ai.engines.services import (
            RuntimeFeedbackService,
            _get_request_manager,
        )
        from app.modules.ai.utils.helpers import envelope_to_api_dict

        rm = _get_request_manager()

        txn = await self.transaction_repo.get_by_id(transaction_id)
        if txn is None or txn.portfolio_id is None:
            return None

        portfolio = await self.portfolio_repo.get_by_id(txn.portfolio_id)
        if portfolio is None:
            return None

        holdings = await self.holding_repo.list_by_portfolio(portfolio.id)
        company = await self.company_repo.get_by_id(txn.company_id)
        if company is None:
            return None

        sectors: set[str] = set()
        for h in holdings:
            c = await self.company_repo.get_by_id(h.company_id)
            if c:
                sectors.add(c.sector)

        service = RuntimeFeedbackService(rm)
        response = await service.post_trade_feedback(
            user=user,
            transaction=txn,
            company=company,
            holding_count=len(holdings),
            sector_count=len(sectors),
            remaining_cash=float(portfolio.virtual_cash),
        )

        if response is None:
            return None
        return envelope_to_api_dict(response)

    # ─── Private helpers ───

    async def _build_companies_map(
        self, holdings: list[Any]
    ) -> dict[str, Any]:
        """Fetch companies for all holdings and return id->company map."""
        companies: dict[str, Any] = {}
        for h in holdings:
            if h.company_id not in companies:
                c = await self.company_repo.get_by_id(h.company_id)
                if c:
                    companies[h.company_id] = c
        return companies

    @staticmethod
    def _calc_pnl_percent(avg_price: float, current_price: float) -> float:
        """Calculate percentage P&L given average buy price and current price."""
        if avg_price <= 0:
            return 0.0
        return round(((current_price - avg_price) / avg_price) * 100, 2)