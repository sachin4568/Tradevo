"""Research API endpoints.

Generate, list, and retrieve AI-powered research reports.
All endpoints require authentication (Bearer token).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.api.schemas.research import GenerateReportRequest
from app.dependencies import get_current_user, get_db_session
from app.modules.auth.models import User
from app.modules.research.service import ResearchService

router = APIRouter(tags=["Research"])


@router.post(
    "/generate",
    response_model=ApiResponse,
    summary="Generate research report",
    description=(
        "Generate an AI-powered research report for a company. "
        "The prompt template is selected from the prompt registry by key. "
        "Report generation may take several seconds."
    ),
    responses={
        200: {
            "description": "Report generated",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Research report generated successfully",
                        "data": {"id": "rpt-abc", "companyId": "cmp-abc", "content": "..."},
                    }
                }
            },
        },
        401: {"description": "Unauthorized"},
        404: {"description": "Company not found"},
        502: {"description": "AI service unavailable"},
    },
)
async def generate_report(
    body: GenerateReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate an AI research report for a company."""
    service = ResearchService(db)
    report = await service.generate_report(
        user_id=user.id,
        company_id=body.companyId,
        prompt_key=body.promptKey,
        source_type=body.sourceType or "manual",
    )
    await db.commit()
    return ApiResponse(
        message="Research report generated successfully",
        data=report,
    )


@router.get(
    "",
    response_model=ApiResponse,
    summary="List research reports",
    description="Return paginated list of the user's research reports, newest first.",
    responses={200: {"description": "Research reports"}, 401: {"description": "Unauthorized"}},
)
async def list_reports(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(ge=1, le=100, default=20, description="Reports per page"),
    offset: int = Query(ge=0, default=0, description="Number of reports to skip"),
) -> dict:
    """List research reports for the authenticated user."""
    service = ResearchService(db)
    result = await service.list_reports(user.id, limit=limit, offset=offset)
    return ApiResponse(
        message="Research reports retrieved successfully",
        data=result,
    )


@router.get(
    "/prompts",
    response_model=ApiResponse,
    summary="List prompt templates",
    description="Return all available AI analysis prompt templates from the prompt registry.",
    responses={200: {"description": "Prompt templates"}, 401: {"description": "Unauthorized"}},
)
async def list_prompts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """List all available prompt templates."""
    service = ResearchService(db)
    prompts = await service.list_prompts()
    return ApiResponse(
        message="Prompt templates retrieved successfully",
        data=prompts,
    )


@router.get(
    "/company/{company_id}",
    response_model=ApiResponse,
    summary="Get latest report for company",
    description="Return the most recent research report for a specific company.",
    responses={200: {"description": "Latest report"}, 401: {"description": "Unauthorized"}, 404: {"description": "No report found"}},
)
async def get_latest_company_report(
    company_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get the latest research report for a company."""
    service = ResearchService(db)
    report = await service.get_latest_report(user.id, company_id)
    if report is None:
        return ApiResponse(
            message="No research report found for this company",
            data=None,
        )
    return ApiResponse(
        message="Research report retrieved successfully",
        data=report,
    )


@router.get(
    "/{report_id}",
    response_model=ApiResponse,
    summary="Get research report",
    description="Return a specific research report by its ID.",
    responses={200: {"description": "Research report"}, 401: {"description": "Unauthorized"}, 404: {"description": "Report not found"}},
)
async def get_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get a specific research report."""
    service = ResearchService(db)
    report = await service.get_report(user.id, report_id)
    return ApiResponse(
        message="Research report retrieved successfully",
        data=report,
    )
