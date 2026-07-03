"""Learning API endpoints.

Start/end learning sessions, record lesson progress, and view statistics.
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
    responses={201: {"description": "Learning session started"}, 401: {"description": "Unauthorized"}},
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
    responses={
        200: {"description": "Session ended"},
        401: {"description": "Unauthorized"},
        404: {"description": "Session not found"},
    },
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
        "Stores lesson ID, module ID, and status (started or completed)."
    ),
    responses={
        200: {"description": "Progress recorded"},
        401: {"description": "Unauthorized"},
    },
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
    description="Return active session, completed sessions, and lesson counts.",
    responses={200: {"description": "Learning progress"}, 401: {"description": "Unauthorized"}},
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
    description="Return aggregate statistics including streaks, time spent, and module completion.",
    responses={200: {"description": "Learning statistics"}, 401: {"description": "Unauthorized"}},
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
