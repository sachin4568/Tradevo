"""Learning API request/response schemas.

Request schemas validate incoming bodies.
Response schemas document the API contract for OpenAPI.
"""

from pydantic import BaseModel, Field

# ─── Request Schemas ───


class EndSessionRequest(BaseModel):
    """Optional body for ending a learning session."""

    improvementSummary: str | None = Field(
        None,
        max_length=5000,
        description="Optional summary of improvement insights",
    )


class LessonProgressRequest(BaseModel):
    """Request body for recording lesson progress.

    Revision #4: Only stores lesson ID, module ID, and status.
    Lesson content is NOT sent to the backend.
    """

    lessonId: str = Field(min_length=1, description="Lesson ID being tracked")
    moduleId: str = Field(min_length=1, description="Parent module ID")
    status: str = Field(
        pattern="^(in_progress|completed)$",
        description="Lesson status: in_progress or completed",
    )


# ─── Response Schemas (for OpenAPI documentation) ───


class LearningSessionResponse(BaseModel):
    """A learning session object."""

    id: str
    userId: str
    startTime: str
    endTime: str = ""
    status: str
    lessonProgress: dict = Field(default_factory=dict)
    companiesStudied: list = Field(default_factory=list)
    simulatedTradesCount: int = 0
    improvementSummary: str = ""
    createdAt: str = ""
    updatedAt: str = ""


class ProgressResponse(BaseModel):
    """User's overall learning progress."""

    activeSession: LearningSessionResponse | None = None
    completedSessions: list[LearningSessionResponse] = Field(default_factory=list)
    totalSessions: int = 0
    lessonsStarted: int = 0
    lessonsCompleted: int = 0


class StatisticsResponse(BaseModel):
    """Aggregate learning statistics."""

    totalSessions: int = 0
    completedSessions: int = 0
    activeSession: LearningSessionResponse | None = None
    totalTimeSeconds: float = 0.0
    companiesStudied: list[str] = Field(default_factory=list)
    companiesStudiedCount: int = 0
    totalSimulatedTrades: int = 0
    streakDays: int = 0
