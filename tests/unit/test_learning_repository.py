"""Unit tests for LearningRepository.

Uses shared test fixtures from conftest.py (SQLite in-memory, auto-rollback).
"""

from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.learning.models import LearningSession
from app.modules.learning.repository import LearningRepository

_NOW = datetime(2026, 7, 1, 12, 0, tzinfo=UTC)


def _user(uid: str = "usr-lrn1") -> User:
    return User(
        id=uid, name="Learner", email=f"{uid}@t.com",
        password_hash="hash", experience_level="beginner",
        risk_preference="moderate", created_at=_NOW, updated_at=_NOW,
    )


def _session(
    sid: str = "lsn-test1",
    user_id: str = "usr-lrn1",
    status: str = "ACTIVE",
    **overrides,
) -> LearningSession:
    data = {
        "id": sid, "user_id": user_id, "status": status,
        "start_time": _NOW, "end_time": None,
        "lesson_progress": {"version": 1, "data": {}},
        "companies_studied": [], "simulated_trades_count": 0,
        "created_at": _NOW, "updated_at": _NOW,
    }
    data.update(overrides)
    return LearningSession(**data)


async def seed_user(session: AsyncSession, uid: str = "usr-lrn1") -> User:
    u = _user(uid)
    session.add(u)
    await session.flush()
    return u


class TestLearningRepository:
    @pytest.mark.asyncio
    async def test_create_session(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        repo = LearningRepository(test_session)
        session = await repo.create("lsn-new", "usr-lrn1")
        assert session.id == "lsn-new"
        assert session.status == "ACTIVE"
        assert session.lesson_progress == {"version": 1, "data": {}}

    @pytest.mark.asyncio
    async def test_get_by_id(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s = _session(sid="lsn-find")
        test_session.add(s)
        await test_session.flush()
        repo = LearningRepository(test_session)
        result = await repo.get_by_id("lsn-find")
        assert result is not None
        assert result.status == "ACTIVE"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, test_session: AsyncSession) -> None:
        repo = LearningRepository(test_session)
        result = await repo.get_by_id("lsn-nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_active_by_user(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s = _session()
        test_session.add(s)
        await test_session.flush()
        repo = LearningRepository(test_session)
        result = await repo.get_active_by_user("usr-lrn1")
        assert result is not None
        assert result.status == "ACTIVE"

    @pytest.mark.asyncio
    async def test_get_active_by_user_none(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        repo = LearningRepository(test_session)
        result = await repo.get_active_by_user("usr-lrn1")
        assert result is None

    @pytest.mark.asyncio
    async def test_end_session(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s = _session()
        test_session.add(s)
        await test_session.flush()
        repo = LearningRepository(test_session)
        result = await repo.end_session(s, improvement_summary="Good session")
        assert result.status == "COMPLETED"
        assert result.end_time is not None
        assert result.improvement_summary == "Good session"

    @pytest.mark.asyncio
    async def test_list_by_user(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s1 = _session(sid="lsn-a", status="COMPLETED", end_time=_NOW)
        s2 = _session(sid="lsn-b", status="COMPLETED", end_time=_NOW)
        test_session.add(s1)
        test_session.add(s2)
        await test_session.flush()
        repo = LearningRepository(test_session)
        result = await repo.list_by_user("usr-lrn1")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_count_completed_by_user(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s1 = _session(sid="lsn-c", status="COMPLETED", end_time=_NOW)
        test_session.add(s1)
        await test_session.flush()
        repo = LearningRepository(test_session)
        count = await repo.count_completed_by_user("usr-lrn1")
        assert count == 1

    @pytest.mark.asyncio
    async def test_update_lesson_progress(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s = _session()
        test_session.add(s)
        await test_session.flush()
        repo = LearningRepository(test_session)
        new_progress = {
            "version": 1,
            "data": {
                "lesson-1": {"status": "completed", "completedAt": _NOW.isoformat()},
            },
        }
        await repo.update_lesson_progress(s, new_progress)
        assert s.lesson_progress["data"]["lesson-1"]["status"] == "completed"

    @pytest.mark.asyncio
    async def test_add_company_studied(self, test_session: AsyncSession) -> None:
        await seed_user(test_session)
        s = _session(companies_studied=["cmp-a"])
        test_session.add(s)
        await test_session.flush()
        repo = LearningRepository(test_session)
        await repo.add_company_studied(s, "cmp-b")
        assert "cmp-b" in s.companies_studied
        # No duplicates
        await repo.add_company_studied(s, "cmp-a")
        assert s.companies_studied.count("cmp-a") == 1
