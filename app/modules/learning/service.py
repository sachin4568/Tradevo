"""LearningService — learning session management and progress tracking.

Handles session lifecycle (start/end), lesson progress recording,
and statistics computation. Lesson content remains owned by the
frontend; this service tracks only IDs and progress metadata.

Revision #3: Enforces single ACTIVE session per user.
Revision #4: Stores only lesson IDs and progress metadata.
Revision #5: Emits LearningSessionStarted, LearningSessionCompleted,
             and LessonCompleted domain events.
"""

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DomainError, NotFoundError
from app.core.utils import generate_entity_id
from app.modules.learning.events import (
    LearningSessionCompleted,
    LearningSessionStarted,
    LessonCompleted,
)
from app.modules.learning.repository import LearningRepository

logger = logging.getLogger(__name__)


class LearningService:
    """Learning session and progress management.

    All mutations go through this service. Read-only queries
    are also here since the learning module has no separate
    read service.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.repo = LearningRepository(db)
        self._event_hooks: list = []

    def register_event_hook(self, hook) -> None:
        """Register a callback for domain events (fire-and-forget)."""
        self._event_hooks.append(hook)

    async def _emit_event(self, event) -> None:
        """Invoke registered event hooks."""
        for hook in self._event_hooks:
            try:
                if callable(hook):
                    result = hook(event)
                    if hasattr(result, "__await__"):
                        await result
            except Exception:
                logger.exception("Event hook failed for event %s", event.event_type)

    async def start_session(self, user_id: str) -> dict:
        """Start a new learning session.

        Revision #3: If the user already has an ACTIVE session,
        it is auto-ended before creating a new one.

        Returns:
            dict with the new session's data.

        Raises:
            None — always succeeds.
        """
        # Auto-end any existing active session
        existing = await self.repo.get_active_by_user(user_id)
        if existing is not None:
            await self._end_existing(existing)

        session_id = generate_entity_id("lsn")
        session = await self.repo.create(session_id, user_id)

        event = LearningSessionStarted(
            session_id=session.id,
            user_id=user_id,
        )
        await self._emit_event(event)

        logger.info("Learning session started: user=%s session=%s", user_id, session.id)
        return self._session_to_dict(session)

    async def end_session(
        self,
        user_id: str,
        session_id: str,
        improvement_summary: str | None = None,
    ) -> dict:
        """End an active learning session.

        Args:
            user_id: The user ending the session.
            session_id: The session to end.
            improvement_summary: Optional text summary.

        Returns:
            dict with the updated session's data.

        Raises:
            NotFoundError: If session doesn't exist.
            DomainError: If session is already completed.
        """
        session = await self.repo.get_by_id(session_id)
        if session is None:
            raise NotFoundError(message="Learning session not found")
        if session.user_id != user_id:
            raise NotFoundError(message="Learning session not found")
        if session.status == "COMPLETED":
            raise DomainError(
                message="Session is already completed",
                error_code="SESSION_ALREADY_COMPLETED",
            )

        await self.repo.end_session(
            session, improvement_summary=improvement_summary
        )

        duration = 0.0
        if session.start_time and session.end_time:
            st = session.start_time
            et = session.end_time
            if st.tzinfo is None:
                st = st.replace(tzinfo=UTC)
            if et.tzinfo is None:
                et = et.replace(tzinfo=UTC)
            duration = (et - st).total_seconds()

        lessons_completed = self._count_completed_lessons(session.lesson_progress)

        event = LearningSessionCompleted(
            session_id=session.id,
            user_id=user_id,
            duration_seconds=duration,
            lessons_completed_count=lessons_completed,
            simulated_trades_count=session.simulated_trades_count or 0,
        )
        await self._emit_event(event)

        logger.info(
            "Learning session completed: user=%s session=%s duration=%.0fs",
            user_id,
            session.id,
            duration,
        )
        return self._session_to_dict(session)

    async def record_lesson_progress(
        self,
        user_id: str,
        lesson_id: str,
        module_id: str,
        status: str,
    ) -> dict:
        """Record lesson progress within the active session.

        Revision #4: Stores only lesson ID, module ID, status, and
        timestamps. Lesson content is NOT stored.

        Args:
            user_id: The user.
            lesson_id: The lesson being tracked.
            module_id: The parent module ID.
            status: "in_progress" or "completed".

        Returns:
            dict with updated lesson progress data.

        Raises:
            NotFoundError: If no active session exists.
            DomainError: If status is invalid.
        """
        if status not in ("in_progress", "completed"):
            raise DomainError(
                message="Lesson status must be 'in_progress' or 'completed'",
                error_code="INVALID_LESSON_STATUS",
            )

        session = await self.repo.get_active_by_user(user_id)
        if session is None:
            raise NotFoundError(message="No active learning session")

        progress = dict(session.lesson_progress) if session.lesson_progress else {"version": 1, "data": {}}
        data = progress.get("data", {})
        now = datetime.now(UTC).isoformat()

        existing_lesson = data.get(lesson_id, {})
        existing_lesson.update({
            "lessonId": lesson_id,
            "moduleId": module_id,
            "status": status,
            "updatedAt": now,
        })
        if status == "completed" and "completedAt" not in existing_lesson:
            existing_lesson["completedAt"] = now
        if status == "in_progress" and "startedAt" not in existing_lesson:
            existing_lesson["startedAt"] = now

        data[lesson_id] = existing_lesson
        progress["data"] = data
        progress["version"] = 1

        await self.repo.update_lesson_progress(session, progress)

        # Emit LessonCompleted event if status is completed
        if status == "completed":
            event = LessonCompleted(
                session_id=session.id,
                user_id=user_id,
                lesson_id=lesson_id,
                module_id=module_id,
            )
            await self._emit_event(event)

        return self._extract_lesson_progress(progress)

    async def get_progress(self, user_id: str) -> dict:
        """Get the user's overall learning progress.

        Returns active session, completed sessions, and
        aggregated lesson progress across all sessions.
        """
        active = await self.repo.get_active_by_user(user_id)
        completed_sessions = await self.repo.list_by_user(
            user_id,
            limit=50,
            offset=0,
        )

        completed_list = [
            self._session_to_dict(s)
            for s in completed_sessions
            if s.status == "COMPLETED"
        ]

        # Merge lesson progress from active + recent completed sessions
        all_progress: dict = {}
        if active and active.lesson_progress:
            all_progress.update(active.lesson_progress.get("data", {}))
        for s in completed_list[:10]:
            if s.get("lessonProgress"):
                all_progress.update(s["lessonProgress"].get("data", {}))

        lessons_started = 0
        lessons_completed = 0
        for _lid, lp in all_progress.items():
            lessons_started += 1
            if lp.get("status") == "completed":
                lessons_completed += 1

        return {
            "activeSession": self._session_to_dict(active) if active else None,
            "completedSessions": completed_list,
            "totalSessions": len(completed_list) + (1 if active else 0),
            "lessonsStarted": lessons_started,
            "lessonsCompleted": lessons_completed,
        }

    async def get_statistics(self, user_id: str) -> dict:
        """Get aggregate learning statistics for the user."""
        active = await self.repo.get_active_by_user(user_id)
        completed_count = await self.repo.count_completed_by_user(user_id)

        # Compute total time from completed sessions
        total_time_seconds = 0.0
        completed_sessions = await self.repo.list_by_user(user_id, limit=1000)
        companies_studied: set[str] = set()
        total_trades = 0

        for s in completed_sessions:
            if s.status == "COMPLETED" and s.start_time and s.end_time:
                st = s.start_time
                et = s.end_time
                if st.tzinfo is None:
                    st = st.replace(tzinfo=UTC)
                if et.tzinfo is None:
                    et = et.replace(tzinfo=UTC)
                total_time_seconds += (et - st).total_seconds()
            if s.companies_studied:
                companies_studied.update(s.companies_studied)
            total_trades += s.simulated_trades_count or 0

        # Add active session data
        if active:
            if active.start_time:
                st = active.start_time
                if st.tzinfo is None:
                    st = st.replace(tzinfo=UTC)
                total_time_seconds += (
                    datetime.now(UTC) - st
                ).total_seconds()
            if active.companies_studied:
                companies_studied.update(active.companies_studied)
            total_trades += active.simulated_trades_count or 0

        # Compute streak (consecutive days with sessions)
        streak = await self._compute_streak(user_id, completed_sessions)

        return {
            "totalSessions": completed_count + (1 if active else 0),
            "completedSessions": completed_count,
            "activeSession": self._session_to_dict(active) if active else None,
            "totalTimeSeconds": round(total_time_seconds, 1),
            "companiesStudied": sorted(companies_studied),
            "companiesStudiedCount": len(companies_studied),
            "totalSimulatedTrades": total_trades,
            "streakDays": streak,
        }

    # ─── Private helpers ───

    async def _end_existing(self, session) -> None:
        """Auto-end an existing active session."""
        await self.repo.end_session(session)
        logger.info(
            "Auto-ended previous session: user=%s session=%s",
            session.user_id,
            session.id,
        )

    async def _compute_streak(
        self, user_id: str, sessions: list
    ) -> int:
        """Compute consecutive-day learning streak."""
        if not sessions:
            return 0

        # Collect unique session dates (based on start_time)
        dates: set[str] = set()
        for s in sessions:
            if s.start_time:
                dates.add(s.start_time.strftime("%Y-%m-%d"))

        if not dates:
            return 0

        sorted_dates = sorted(dates, reverse=True)
        today = datetime.now(UTC).strftime("%Y-%m-%d")

        # Check if most recent date is today or yesterday
        from datetime import timedelta

        if sorted_dates[0] != today:
            yesterday = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")
            if sorted_dates[0] != yesterday:
                return 0

        streak = 1
        for i in range(1, len(sorted_dates)):
            prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d").date()
            curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d").date()
            if (prev - curr).days == 1:
                streak += 1
            else:
                break

        return streak

    @staticmethod
    def _count_completed_lessons(lesson_progress: dict | None) -> int:
        """Count completed lessons from versioned JSON progress."""
        if not lesson_progress:
            return 0
        data = lesson_progress.get("data", {})
        return sum(1 for v in data.values() if isinstance(v, dict) and v.get("status") == "completed")

    @staticmethod
    def _session_to_dict(session) -> dict:
        """Convert a LearningSession ORM model to camelCase dict."""
        if session is None:
            return {}
        return {
            "id": session.id,
            "userId": session.user_id,
            "startTime": session.start_time.isoformat() if session.start_time else "",
            "endTime": session.end_time.isoformat() if session.end_time else "",
            "status": session.status,
            "lessonProgress": session.lesson_progress or {"version": 1, "data": {}},
            "companiesStudied": session.companies_studied or [],
            "simulatedTradesCount": session.simulated_trades_count or 0,
            "improvementSummary": session.improvement_summary or "",
            "createdAt": session.created_at.isoformat() if session.created_at else "",
            "updatedAt": session.updated_at.isoformat() if session.updated_at else "",
        }

    # ─── AI Orchestration (Milestone 7.1) ───

    async def get_ai_guidance(self, user_id: str, user: Any) -> dict | None:
        """Generate learning guidance for a user.

        Orchestrates data fetching + AI engine call.  Returns the
        AIResponseEnvelope as a dict, or None if AI is unavailable.
        """
        from app.modules.ai.engines.services import (
            LearningIntelligenceService,
            _get_request_manager,
        )
        from app.modules.ai.repository import DecisionTimelineRepository
        from app.modules.ai.utils.helpers import envelope_to_api_dict
        from app.modules.market.repository import CompanyRepository
        from app.modules.portfolio.repository import (
            HoldingRepository,
            PortfolioRepository,
        )

        rm = _get_request_manager()
        if rm is None:
            return None

        portfolio_repo = PortfolioRepository(self.repo.db)
        holding_repo = HoldingRepository(self.repo.db)
        company_repo = CompanyRepository(self.repo.db)
        decision_repo = DecisionTimelineRepository(self.repo.db)

        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            return None

        holdings = await holding_repo.list_by_portfolio(portfolio.id)
        sessions = await self.repo.list_by_user(user_id, limit=20)
        decisions = await decision_repo.list_by_user(user_id, limit=20)

        companies_by_id: dict = {}
        for h in holdings:
            if h.company_id not in companies_by_id:
                c = await company_repo.get_by_id(h.company_id)
                if c:
                    companies_by_id[h.company_id] = c
        for d in decisions:
            if d.company_id not in companies_by_id:
                c = await company_repo.get_by_id(d.company_id)
                if c:
                    companies_by_id[d.company_id] = c

        service = LearningIntelligenceService(rm)
        response = await service.get_guidance(
            user=user,
            learning_sessions=sessions,
            decisions=decisions,
            holdings=holdings,
            companies_by_id=companies_by_id,
        )

        if response is None:
            return None
        return envelope_to_api_dict(response)

    async def get_ai_lesson_feedback(
        self, user_id: str, lesson_id: str, module_id: str, user: Any
    ) -> dict | None:
        """Generate post-lesson educational feedback.

        Orchestrates data fetching + AI engine call.  Returns the
        AIResponseEnvelope as a dict, or None if AI is unavailable.
        """
        from app.modules.ai.engines.services import (
            RuntimeFeedbackService,
            _get_request_manager,
        )
        from app.modules.ai.utils.helpers import envelope_to_api_dict
        from app.modules.portfolio.repository import (
            HoldingRepository,
            PortfolioRepository,
            TransactionRepository,
        )

        rm = _get_request_manager()

        portfolio_repo = PortfolioRepository(self.repo.db)
        holding_repo = HoldingRepository(self.repo.db)
        txn_repo = TransactionRepository(self.repo.db)

        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if portfolio is None:
            return None

        holdings = await holding_repo.list_by_portfolio(portfolio.id)
        transactions = await txn_repo.list_by_portfolio(portfolio.id, limit=1000)

        service = RuntimeFeedbackService(rm)
        response = await service.post_lesson_feedback(
            user=user,
            lesson_id=lesson_id,
            module_id=module_id,
            total_trades=len(transactions),
            holding_count=len(holdings),
        )

        if response is None:
            return None
        return envelope_to_api_dict(response)

    @staticmethod
    def _extract_lesson_progress(progress: dict) -> dict:
        """Extract flat lesson progress for API response."""
        return {
            "version": progress.get("version", 1),
            "data": progress.get("data", {}),
        }
