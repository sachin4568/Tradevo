"""Learning domain entity (ENT-010: LearningSession).

Stores per-user learning session state including lesson progress metadata.
Lesson content remains owned by the frontend; the backend tracks only
lesson IDs, progress status, and timestamps.

JSON fields use a versioned structure to allow future evolution:
  { "version": 1, "data": { ... } }

Per user revision #3: A single ACTIVE session per user is enforced
by both service validation and a database partial unique index.
"""

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class LearningSession(Base):
    """Tracks a user's educational learning session.

    Each session records start/end times, status, lesson progress
    metadata, and AI-enrichment fields for future milestones.

    Revision #3: Only one ACTIVE session per user is allowed.
    Enforced at DB level via partial unique index and at service
    level via explicit validation.
    """

    __tablename__ = "learning_sessions"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(24),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ACTIVE",
    )  # ACTIVE or COMPLETED

    # Revision #4: Lesson progress metadata (IDs + status, NOT content)
    # Versioned JSON: { "version": 1, "data": { "lessonId": { "status": "...", ... } } }
    lesson_progress: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # Companies the user studied during this session
    companies_studied: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    simulated_trades_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # AI-enrichment fields (populated in later milestones)
    # Versioned JSON: { "version": 1, "data": [ ... ] }
    mistakes_identified: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    lessons_learned: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    improvement_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )

    # Revision #3: Single ACTIVE session per user.
    # Enforced at service level via explicit validation.
    # DB-level partial unique index is in migration 004 (PostgreSQL only;
    # SQLite does not support partial indexes in table_args).
