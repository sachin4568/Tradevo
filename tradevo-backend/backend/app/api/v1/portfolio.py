"""Portfolio API endpoints.

Portfolio summary, holdings list, and transaction history.
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
    description=(
        "Return full portfolio state including virtual cash, total investment, "
        "returns, holdings with live prices and P&L, and computed metrics "
        "(day change, total return percentage)."
    ),
    responses={200: {"description": "Portfolio summary"}, 401: {"description": "Unauthorized"}},
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
    description="Return all current holdings with company metadata, live prices, and P&L.",
    responses={200: {"description": "Holdings list"}, 401: {"description": "Unauthorized"}},
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
    description=(
        "Return paginated transaction history, newest first. "
        "Supports limit (1-100, default 50) and offset (default 0) parameters."
    ),
    responses={200: {"description": "Transaction history"}, 401: {"description": "Unauthorized"}},
)
async def get_transactions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(ge=1, le=100, default=50, description="Number of transactions to return"),
    offset: int = Query(ge=0, default=0, description="Number of transactions to skip"),
) -> dict:
    """Get transaction history for the authenticated user's portfolio."""
    service = PortfolioService(db)
    result = await service.get_transactions(user.id, limit=limit, offset=offset)
    return ApiResponse(
        message="Transactions retrieved successfully",
        data=result,
    )
