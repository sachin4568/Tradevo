"""Company API endpoints.

Company listing, detail, financials, and news.
Public endpoints (no authentication required).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.dependencies import get_db_session
from app.modules.market.service import CompanyService

router = APIRouter(tags=["Companies"])


@router.get(
    "",
    response_model=ApiResponse,
    summary="List all companies",
    description=(
        "Return all companies in the system. Supports optional server-side "
        "filtering by sector name and full-text search across name, symbol, "
        "and sector fields."
    ),
    responses={
        200: {
            "description": "List of companies",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Companies retrieved successfully",
                        "data": [
                            {
                                "id": "cmp-abc",
                                "name": "Reliance Industries",
                                "symbol": "RELIANCE",
                                "sector": "Energy",
                                "currentPrice": 2450.0,
                            }
                        ],
                    }
                }
            },
        }
    },
)
async def list_companies(
    sector: str | None = Query(default=None, description="Filter by sector name"),
    search: str | None = Query(default=None, description="Search name, symbol, or sector"),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """List companies with optional filtering."""
    service = CompanyService(db)
    companies = await service.list_companies(sector=sector, search=search)
    return ApiResponse(
        message="Companies retrieved successfully",
        data=companies,
    )


@router.get(
    "/sectors",
    response_model=ApiResponse,
    summary="List available sectors",
    description="Return all distinct sector values present in the company database.",
    responses={200: {"description": "List of sector names"}},
)
async def list_sectors(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Return all distinct sector values."""
    service = CompanyService(db)
    sectors = await service.get_sectors()
    return ApiResponse(data=sectors)


@router.get(
    "/{company_id}",
    response_model=ApiResponse,
    summary="Get company details",
    description=(
        "Return full company profile with financial metrics, "
        "shareholding pattern, and recent news articles."
    ),
    responses={200: {"description": "Company detail"}, 404: {"description": "Company not found"}},
)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get company detail including financials and news."""
    service = CompanyService(db)
    detail = await service.get_company(company_id)
    return ApiResponse(data=detail)


@router.get(
    "/{company_id}/financials",
    response_model=ApiResponse,
    summary="Get company financials",
    description="Return financial metrics for a company (revenue, profit, debt, ratios).",
    responses={200: {"description": "Financial metrics"}, 404: {"description": "Company not found"}},
)
async def get_company_financials(
    company_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get financial metrics for a company."""
    service = CompanyService(db)
    financials = await service.get_financials(company_id)
    return ApiResponse(data=financials)


@router.get(
    "/{company_id}/news",
    response_model=ApiResponse,
    summary="Get company news",
    description="Return recent news articles related to a specific company.",
    responses={200: {"description": "News articles"}, 404: {"description": "Company not found"}},
)
async def get_company_news(
    company_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get recent news articles for a specific company."""
    service = CompanyService(db)
    news = await service.get_news(company_id)
    return ApiResponse(data=news)
