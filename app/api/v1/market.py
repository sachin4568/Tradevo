"""Market API endpoints.

Market overview, sector performance, calendar, and news.
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
    description=(
        "Return market indices, top gainers and losers, "
        "and sector performance. Falls back to the latest "
        "stored snapshot if the market provider is unavailable."
    ),
    responses={
        200: {
            "description": "Market overview data",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Market overview retrieved successfully",
                        "data": {
                            "indices": [{"name": "NIFTY 50", "value": 24500.0, "change": 0.5}],
                            "topGainers": [],
                            "topLosers": [],
                            "sectors": [],
                        },
                    }
                }
            },
        }
    },
)
async def get_market_overview(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get the full market overview."""
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
    description="Return sector-level performance data with percentage changes.",
    responses={200: {"description": "Sector performance data"}},
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
    description="Return upcoming market holidays and trading events.",
    responses={200: {"description": "Market calendar"}},
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
    description=(
        "Return latest market-level financial news. "
        "Falls back to stored articles if the news provider is unavailable."
    ),
    responses={200: {"description": "Market news articles"}},
)
async def get_market_news(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get market-level news articles."""
    market_provider = create_market_provider()
    news_provider = create_news_provider()
    service = MarketService(
        db, market_provider=market_provider, news_provider=news_provider
    )
    news = await service.get_news()
    return ApiResponse(data=news)
