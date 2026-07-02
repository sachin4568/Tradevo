"""Domain event types for the learning module.

Lightweight dataclasses emitted after learning operations.
No subscribers are implemented yet — these events will support
AI coaching, recommendations, and analytics in later milestones.

Revision #5: Three domain events defined:
- LearningSessionStarted
- LearningSessionCompleted
- LessonCompleted
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class LearningSessionStarted:
    """Emitted when a new learning session is created."""

    event_type: str = "learning.session.started"
    session_id: str = ""
    user_id: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class LearningSessionCompleted:
    """Emitted when a learning session is ended."""

    event_type: str = "learning.session.completed"
    session_id: str = ""
    user_id: str = ""
    duration_seconds: float = 0.0
    lessons_completed_count: int = 0
    simulated_trades_count: int = 0
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class LessonCompleted:
    """Emitted when a user completes a lesson within a session."""

    event_type: str = "learning.lesson.completed"
    session_id: str = ""
    user_id: str = ""
    lesson_id: str = ""
    module_id: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
