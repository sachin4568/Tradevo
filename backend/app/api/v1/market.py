"""Market API endpoints.

GET /market          → market overview (indices, top movers, sectors)
GET /market/sectors  → sector performance only
GET /market/calendar  → upcoming market events/holidays
GET /market/news     → market-level news

Public endpoints (no authentication required).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.dependencies import get_db_session
from app.integrations.market.factory import create_market_provider
from app.integrations.news.factory import create_news_provider
from app.modules.market.service import MarketService

router = APIRouter(tags=["Market"])


@router.get(
    "",
    response_model=ApiResponse,
    summary="Get market overview",
    description="Returns indices, top gainers/losers, and sector performance.",
)
async def get_market_overview(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get the full market overview.

    Tries the market provider first; falls back to the latest
    stored snapshot if the provider is unavailable.
    """
    market_provider = create_market_provider()
    service = MarketService(db, market_provider=market_provider)
    overview = await service.get_overview()
    return ApiResponse(
        message="Market overview retrieved successfully",
        data=overview,
    )


@router.get(
    "/sectors",
    response_model=ApiResponse,
    summary="Get sector performance",
)
async def get_sector_performance(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get sector-level performance data."""
    market_provider = create_market_provider()
    service = MarketService(db, market_provider=market_provider)
    sectors = await service.get_sector_performance()
    return ApiResponse(data=sectors)


@router.get(
    "/calendar",
    response_model=ApiResponse,
    summary="Get market calendar",
    description="Returns upcoming market holidays and trading events.",
)
async def get_market_calendar(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get the market calendar with holidays and events."""
    service = MarketService(db)
    calendar = await service.get_calendar()
    return ApiResponse(data=calendar)


@router.get(
    "/news",
    response_model=ApiResponse,
    summary="Get market news",
    description="Returns latest market-level financial news.",
)
async def get_market_news(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get market-level news articles.

    Tries the news provider first; falls back to stored articles.
    """
    market_provider = create_market_provider()
    news_provider = create_news_provider()
    service = MarketService(
        db, market_provider=market_provider, news_provider=news_provider
    )
    news = await service.get_news()
    return ApiResponse(data=news)
