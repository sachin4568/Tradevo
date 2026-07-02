"""Unit tests for LearningService.

Tests session lifecycle, lesson progress, and domain events.
Uses SQLite in-memory with per-test isolation for service.commit().
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.core.exceptions import DomainError, NotFoundError
from app.modules.auth.models import User
from app.modules.learning.service import LearningService

_NOW = datetime(2026, 7, 1, 12, 0, tzinfo=UTC)


@pytest.fixture
async def learn_engine():
    """Fresh in-memory database per test for LearningService (calls db.commit)."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def learn_session(learn_engine) -> AsyncSession:
    """Session for learning service tests."""
    session_factory = async_sessionmaker(
        learn_engine, class_=AsyncSession, expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


def _user(uid: str = "usr-ls1") -> User:
    return User(
        id=uid, name="Learner", email=f"{uid}@t.com",
        password_hash="hash", experience_level="beginner",
        risk_preference="moderate", created_at=_NOW, updated_at=_NOW,
    )


async def seed_user(session: AsyncSession, uid: str = "usr-ls1") -> str:
    u = _user(uid)
    session.add(u)
    await session.flush()
    return u.id


class TestLearningServiceStart:
    @pytest.mark.asyncio
    async def test_start_session_creates_active(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        result = await service.start_session("usr-ls1")
        assert result["status"] == "ACTIVE"
        assert result["userId"] == "usr-ls1"
        assert result["id"].startswith("lsn-")

    @pytest.mark.asyncio
    async def test_start_session_emits_event(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        events = []
        service.register_event_hook(lambda e: events.append(e))
        await service.start_session("usr-ls1")
        assert len(events) == 1
        assert events[0].event_type == "learning.session.started"

    @pytest.mark.asyncio
    async def test_start_session_auto_ends_existing(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        first = await service.start_session("usr-ls1")
        assert first["status"] == "ACTIVE"

        second = await service.start_session("usr-ls1")
        assert second["status"] == "ACTIVE"
        assert second["id"] != first["id"]

        # First should now be completed
        from app.modules.learning.repository import LearningRepository
        repo = LearningRepository(learn_session)
        old = await repo.get_by_id(first["id"])
        assert old is not None
        assert old.status == "COMPLETED"


class TestLearningServiceEnd:
    @pytest.mark.asyncio
    async def test_end_session(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        started = await service.start_session("usr-ls1")

        result = await service.end_session("usr-ls1", started["id"])
        assert result["status"] == "COMPLETED"
        assert result["endTime"] != ""

    @pytest.mark.asyncio
    async def test_end_session_emits_event(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        started = await service.start_session("usr-ls1")

        events = []
        service.register_event_hook(lambda e: events.append(e))
        await service.end_session("usr-ls1", started["id"])
        assert len(events) == 1
        assert events[0].event_type == "learning.session.completed"

    @pytest.mark.asyncio
    async def test_end_session_not_found(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        with pytest.raises(NotFoundError):
            await service.end_session("usr-ls1", "lsn-fake")

    @pytest.mark.asyncio
    async def test_end_session_already_completed(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        started = await service.start_session("usr-ls1")
        await service.end_session("usr-ls1", started["id"])

        with pytest.raises(DomainError, match="already completed"):
            await service.end_session("usr-ls1", started["id"])


class TestLessonProgress:
    @pytest.mark.asyncio
    async def test_record_lesson_in_progress(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        await service.start_session("usr-ls1")

        result = await service.record_lesson_progress(
            "usr-ls1", "lesson-1", "module-1", "in_progress"
        )
        assert "lesson-1" in result["data"]
        assert result["data"]["lesson-1"]["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_record_lesson_completed(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        await service.start_session("usr-ls1")

        events = []
        service.register_event_hook(lambda e: events.append(e))

        result = await service.record_lesson_progress(
            "usr-ls1", "lesson-1", "module-1", "completed"
        )
        assert result["data"]["lesson-1"]["status"] == "completed"
        assert result["data"]["lesson-1"].get("completedAt") is not None
        assert len(events) == 1
        assert events[0].event_type == "learning.lesson.completed"

    @pytest.mark.asyncio
    async def test_record_lesson_no_active_session(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        with pytest.raises(NotFoundError, match="No active"):
            await service.record_lesson_progress(
                "usr-ls1", "lesson-1", "module-1", "in_progress"
            )

    @pytest.mark.asyncio
    async def test_record_lesson_invalid_status(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        await service.start_session("usr-ls1")
        with pytest.raises(DomainError, match="status"):
            await service.record_lesson_progress(
                "usr-ls1", "lesson-1", "module-1", "invalid"
            )


class TestProgressAndStatistics:
    @pytest.mark.asyncio
    async def test_get_progress_empty(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        result = await service.get_progress("usr-ls1")
        assert result["activeSession"] is None
        assert result["completedSessions"] == []
        assert result["lessonsCompleted"] == 0

    @pytest.mark.asyncio
    async def test_get_progress_with_active(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        await service.start_session("usr-ls1")
        result = await service.get_progress("usr-ls1")
        assert result["activeSession"] is not None
        assert result["activeSession"]["status"] == "ACTIVE"

    @pytest.mark.asyncio
    async def test_get_statistics_empty(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        result = await service.get_statistics("usr-ls1")
        assert result["totalSessions"] == 0
        assert result["streakDays"] == 0

    @pytest.mark.asyncio
    async def test_get_statistics_with_session(self, learn_session: AsyncSession) -> None:
        await seed_user(learn_session)
        service = LearningService(learn_session)
        await service.start_session("usr-ls1")
        result = await service.get_statistics("usr-ls1")
        assert result["totalSessions"] == 1
        assert result["activeSession"] is not None
