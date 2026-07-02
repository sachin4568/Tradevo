"""Learning API endpoints.

POST   /learning/session              → start a new learning session
PATCH  /learning/session/{id}          → end a learning session
POST   /learning/lesson-progress       → record lesson progress
GET    /learning/progress              → learning progress and metrics
GET    /learning/statistics            → aggregate learning statistics

All endpoints require authentication (Bearer token).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.api.schemas.learning import (
    EndSessionRequest,
    LessonProgressRequest,
)
from app.dependencies import get_current_user, get_db_session
from app.modules.auth.models import User
from app.modules.learning.service import LearningService

router = APIRouter(tags=["Learning"])


@router.post(
    "/session",
    response_model=ApiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a learning session",
    description=(
        "Start a new learning session. If an active session exists, "
        "it is auto-ended first. Returns the new session object."
    ),
)
async def start_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Start a new learning session for the authenticated user."""
    service = LearningService(db)
    result = await service.start_session(user.id)
    await db.commit()
    return ApiResponse(
        message="Learning session started",
        data=result,
    )


@router.patch(
    "/session/{session_id}",
    response_model=ApiResponse,
    summary="End a learning session",
    description=(
        "End an active learning session. Optionally provide an "
        "improvement summary. Returns the updated session."
    ),
)
async def end_session(
    session_id: str,
    body: EndSessionRequest | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """End an active learning session."""
    service = LearningService(db)
    summary = body.improvementSummary if body else None
    result = await service.end_session(user.id, session_id, improvement_summary=summary)
    await db.commit()
    return ApiResponse(
        message="Learning session completed",
        data=result,
    )


@router.post(
    "/lesson-progress",
    response_model=ApiResponse,
    summary="Record lesson progress",
    description=(
        "Record progress for a lesson within the active session. "
        "Only stores lesson ID, module ID, and status — not content."
    ),
)
async def record_lesson_progress(
    body: LessonProgressRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Record lesson progress (start or complete)."""
    service = LearningService(db)
    result = await service.record_lesson_progress(
        user.id, body.lessonId, body.moduleId, body.status,
    )
    await db.commit()
    return ApiResponse(
        message="Lesson progress recorded",
        data=result,
    )


@router.get(
    "/progress",
    response_model=ApiResponse,
    summary="Get learning progress",
    description="Returns active session, completed sessions, and lesson counts.",
)
async def get_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get the user's overall learning progress."""
    service = LearningService(db)
    result = await service.get_progress(user.id)
    return ApiResponse(
        message="Learning progress retrieved",
        data=result,
    )


@router.get(
    "/statistics",
    response_model=ApiResponse,
    summary="Get learning statistics",
    description="Returns aggregate statistics including streaks and time spent.",
)
async def get_statistics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get aggregate learning statistics for the user."""
    service = LearningService(db)
    result = await service.get_statistics(user.id)
    return ApiResponse(
        message="Learning statistics retrieved",
        data=result,
    )
