"""Transaction (Trade) API endpoints.

POST /transactions/buy  → execute a buy order
POST /transactions/sell → execute a sell order

Frontend sends ONLY companyId + quantity (revision #4).
Backend fetches the execution price from MarketProvider.
All endpoints require authentication.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.api.schemas.portfolio import TradeRequest
from app.dependencies import get_current_user, get_db_session
from app.integrations.market.factory import create_market_provider
from app.modules.ai.decision_hook import create_decision_timeline_hook
from app.modules.auth.models import User
from app.modules.portfolio.trade_service import TradeExecutionService

router = APIRouter(tags=["Transactions"])


@router.post(
    "/buy",
    response_model=ApiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute a buy order",
    description=(
        "Buy shares of a company. Frontend sends only companyId and quantity. "
        "Backend fetches the current market price. "
        "Returns transaction, updated portfolio, and updated holding."
    ),
)
async def buy_stock(
    body: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Execute a BUY operation atomically.

    The service coordinates MarketProvider, PortfolioRepository,
    HoldingRepository, and TransactionRepository in a single DB transaction.
    """
    market_provider = create_market_provider()
    service = TradeExecutionService(db, market_provider=market_provider)
    service.register_event_hook(create_decision_timeline_hook(db))

    result = await service.execute_buy(
        user_id=user.id,
        company_id=body.companyId,
        quantity=body.quantity,
    )

    return ApiResponse(
        message="Buy order executed successfully",
        data={
            "transaction": result.transaction,
            "portfolio": result.portfolio,
            "holding": result.holding,
            "remainingCash": result.remainingCash,
        },
    )


@router.post(
    "/sell",
    response_model=ApiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute a sell order",
    description=(
        "Sell shares of a company. Frontend sends only companyId and quantity. "
        "Backend fetches the current market price. "
        "Returns transaction, updated portfolio, and updated holding."
    ),
)
async def sell_stock(
    body: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Execute a SELL operation atomically.

    Validates sufficient holdings, then coordinates MarketProvider,
    PortfolioRepository, HoldingRepository, and TransactionRepository
    in a single DB transaction.
    """
    market_provider = create_market_provider()
    service = TradeExecutionService(db, market_provider=market_provider)
    service.register_event_hook(create_decision_timeline_hook(db))

    result = await service.execute_sell(
        user_id=user.id,
        company_id=body.companyId,
        quantity=body.quantity,
    )

    return ApiResponse(
        message="Sell order executed successfully",
        data={
            "transaction": result.transaction,
            "portfolio": result.portfolio,
            "holding": result.holding,
            "remainingCash": result.remainingCash,
        },
    )
