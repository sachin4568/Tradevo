"""Portfolio API endpoints.

GET  /portfolio/summary     → full portfolio with holdings and metrics
GET  /portfolio/holdings   → holdings list with P&L
GET  /portfolio/transactions → paginated transaction history

All endpoints require authentication (Bearer token).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.dependencies import get_current_user, get_db_session
from app.modules.auth.models import User
from app.modules.portfolio.service import PortfolioService

router = APIRouter(tags=["Portfolio"])


@router.get(
    "/summary",
    response_model=ApiResponse,
    summary="Get portfolio summary",
    description="Returns portfolio state, holdings with P&L, and computed metrics.",
)
async def get_portfolio_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get full portfolio summary including holdings with live prices and P&L."""
    service = PortfolioService(db)
    summary = await service.get_summary(user.id)
    return ApiResponse(
        message="Portfolio retrieved successfully",
        data=summary,
    )


@router.get(
    "/holdings",
    response_model=ApiResponse,
    summary="Get holdings list",
    description="Returns all current holdings with company metadata and P&L.",
)
async def get_holdings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get all holdings for the authenticated user's portfolio."""
    service = PortfolioService(db)
    holdings = await service.get_holdings(user.id)
    return ApiResponse(
        message="Holdings retrieved successfully",
        data=holdings,
    )


@router.get(
    "/transactions",
    response_model=ApiResponse,
    summary="Get transaction history",
    description="Returns paginated transaction history, newest first.",
)
async def get_transactions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(ge=1, le=100, default=50),
    offset: int = Query(ge=0, default=0),
) -> dict:
    """Get transaction history for the authenticated user's portfolio."""
    service = PortfolioService(db)
    result = await service.get_transactions(user.id, limit=limit, offset=offset)
    return ApiResponse(
        message="Transactions retrieved successfully",
        data=result,
    )
