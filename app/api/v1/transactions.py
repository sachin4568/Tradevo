"""Transaction (Trade) API endpoints.

Execute buy and sell orders. Frontend sends only companyId and quantity;
the backend fetches the current market price.
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
        "Buy shares of a company at the current market price. "
        "Requires sufficient virtual cash. Returns the transaction record, "
        "updated portfolio state, updated holding, and remaining cash."
    ),
    responses={
        201: {
            "description": "Buy order executed",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Buy order executed successfully",
                        "data": {
                            "transaction": {"id": "txn-abc", "type": "buy", "quantity": 10},
                            "portfolio": {"virtualCash": 985000.0},
                            "holding": {"companyId": "cmp-abc", "quantity": 10},
                            "remainingCash": 985000.0,
                        },
                    }
                }
            },
        },
        400: {"description": "Insufficient funds or invalid trade"},
        401: {"description": "Unauthorized"},
        404: {"description": "Company not found"},
    },
)
async def buy_stock(
    body: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Execute a BUY operation atomically."""
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
        "Sell shares of a company at the current market price. "
        "Requires sufficient holdings. Returns the transaction record, "
        "updated portfolio state, updated holding, and remaining cash."
    ),
    responses={
        201: {
            "description": "Sell order executed",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Sell order executed successfully",
                        "data": {
                            "transaction": {"id": "txn-abc", "type": "sell", "quantity": 5},
                            "portfolio": {"virtualCash": 1000000.0},
                            "holding": {"companyId": "cmp-abc", "quantity": 5},
                            "remainingCash": 1000000.0,
                        },
                    }
                }
            },
        },
        400: {"description": "Insufficient shares or invalid trade"},
        401: {"description": "Unauthorized"},
        404: {"description": "Company or holding not found"},
    },
)
async def sell_stock(
    body: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Execute a SELL operation atomically."""
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
