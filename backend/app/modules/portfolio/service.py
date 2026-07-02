"""PortfolioService — portfolio read operations.

Handles portfolio summary, holdings listing, and transaction history.
Trade execution is handled by TradeExecutionService.

This service is read-only; all mutations go through TradeExecutionService.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.market.repository import CompanyRepository
from app.modules.portfolio.repository import (
    HoldingRepository,
    PortfolioRepository,
    TransactionRepository,
)


class PortfolioService:
    """Read-only portfolio operations.

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

    @staticmethod
    def _calc_pnl_percent(avg_price: float, current_price: float) -> float:
        """Calculate percentage P&L given average buy price and current price."""
        if avg_price <= 0:
            return 0.0
        return round(((current_price - avg_price) / avg_price) * 100, 2)
