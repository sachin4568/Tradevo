"""Company API endpoints.

GET /companies          → list all companies (optional sector/search filter)
GET /companies/{id}     → company detail with financials and news
GET /companies/{id}/financials → financial summary only
GET /companies/{id}/news       → company news only

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
    description="Returns all companies. Optionally filter by sector or search query.",
)
async def list_companies(
    sector: str | None = Query(default=None, description="Filter by sector"),
    search: str | None = Query(default=None, description="Search name, symbol, or sector"),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """List companies with optional filtering.

    The frontend loads all companies and filters client-side.
    Server-side filtering is available via query parameters.
    """
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
    description="Returns full company profile, financials, and recent news.",
)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get company detail including financials and news.

    Returns the CompanyDetail shape expected by the frontend:
    all Company fields + financials object + news array.
    """
    service = CompanyService(db)
    detail = await service.get_company(company_id)
    return ApiResponse(data=detail)


@router.get(
    "/{company_id}/financials",
    response_model=ApiResponse,
    summary="Get company financials",
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
)
async def get_company_news(
    company_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get recent news articles for a specific company."""
    service = CompanyService(db)
    news = await service.get_news(company_id)
    return ApiResponse(data=news)
