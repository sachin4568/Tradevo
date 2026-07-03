"""AI Intelligence API endpoints.

AI-powered portfolio analysis, observations, and educational feedback.
All endpoints require authentication. AI failures return gracefully
with null content — the application continues normally.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.dependencies import get_current_user, get_db_session
from app.modules.auth.models import User
from app.modules.learning.service import LearningService
from app.modules.portfolio.service import PortfolioService

router = APIRouter(tags=["AI Intelligence"])


@router.post(
    "/dna",
    response_model=ApiResponse,
    summary="Investment DNA analysis",
    description=(
        "Analyse investing behaviour patterns and return descriptive observations. "
        "Results are AI-generated and may not be available if the AI service is down."
    ),
    responses={
        200: {"description": "DNA analysis generated"},
        502: {"description": "AI service unavailable (returns null data)"},
    },
)
async def get_investment_dna(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate Investment DNA analysis."""
    service = PortfolioService(db)
    result = await service.get_ai_dna(user.id, user)
    if result is None:
        return ApiResponse(message="AI service unavailable", data=None)
    return ApiResponse(message="Investment DNA analysis generated", data=result)


@router.get(
    "/observations",
    response_model=ApiResponse,
    summary="Portfolio observations",
    description=(
        "Generate observations about portfolio characteristics. "
        "Returns descriptive insights only — no buy/sell recommendations."
    ),
    responses={
        200: {"description": "Observations generated"},
        502: {"description": "AI service unavailable (returns null data)"},
    },
)
async def get_portfolio_observations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate portfolio observations."""
    service = PortfolioService(db)
    result = await service.get_ai_observations(user.id)
    if result is None:
        return ApiResponse(message="AI service unavailable", data=None)
    return ApiResponse(message="Portfolio observations generated", data=result)


@router.post(
    "/feedback/trade",
    response_model=ApiResponse,
    summary="Post-trade educational feedback",
    description=(
        "Short educational insight after a trade execution. "
        "Optional — returns null if AI is unavailable."
    ),
    responses={200: {"description": "Feedback generated"}, 404: {"description": "Transaction not found"}},
)
async def post_trade_feedback(
    transaction_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate short educational feedback after a trade."""
    service = PortfolioService(db)
    result = await service.get_ai_trade_feedback(user.id, transaction_id, user)
    if result is None:
        return ApiResponse(message="Feedback unavailable", data=None)
    return ApiResponse(message="Feedback generated", data=result)


@router.post(
    "/feedback/lesson",
    response_model=ApiResponse,
    summary="Post-lesson educational feedback",
    description="Short educational reinforcement after completing a lesson. Optional.",
    responses={200: {"description": "Feedback generated"}},
)
async def post_lesson_feedback(
    lesson_id: str,
    module_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate short educational feedback after a lesson."""
    service = LearningService(db)
    result = await service.get_ai_lesson_feedback(user.id, lesson_id, module_id, user)
    if result is None:
        return ApiResponse(message="Feedback unavailable", data=None)
    return ApiResponse(message="Feedback generated", data=result)


@router.get(
    "/learning/guidance",
    response_model=ApiResponse,
    summary="Learning guidance",
    description="Generate contextual learning guidance based on user activity and portfolio.",
    responses={200: {"description": "Guidance generated"}, 502: {"description": "AI service unavailable"}},
)
async def get_learning_guidance(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate contextual learning guidance."""
    service = LearningService(db)
    result = await service.get_ai_guidance(user.id, user)
    if result is None:
        return ApiResponse(message="AI service unavailable", data=None)
    return ApiResponse(message="Learning guidance generated", data=result)
