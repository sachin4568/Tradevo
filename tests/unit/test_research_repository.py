"""Unit tests for ResearchRepository."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.research.repository import ResearchRepository


@pytest.mark.asyncio
async def test_create_and_get_report(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test creating a research report and fetching it."""
    repo = ResearchRepository(test_session)

    report = await repo.create(
        report_id="rpt-test001",
        user_id=seed_user.id,
        company_id=seed_company.id,
        source_type="manual",
        summary="Test summary",
        analysis={"version": 1, "data": {"content": "Test"}},
        prompt_key="research.company_analysis",
        model_used="mock-gpt-4o",
        tokens_used=100,
        generation_time_ms=500,
    )

    assert report.id == "rpt-test001"
    assert report.summary == "Test summary"

    fetched = await repo.get_by_id("rpt-test001")
    assert fetched is not None
    assert fetched.company_id == seed_company.id


@pytest.mark.asyncio
async def test_get_latest_for_company(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test fetching the latest report for a (user, company) pair."""
    repo = ResearchRepository(test_session)

    await repo.create(
        report_id="rpt-test002",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )
    await repo.create(
        report_id="rpt-test003",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    latest = await repo.get_latest_for_company(seed_user.id, seed_company.id)
    assert latest is not None
    assert latest.id == "rpt-test003"


@pytest.mark.asyncio
async def test_list_and_count_reports(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test listing and counting research reports."""
    repo = ResearchRepository(test_session)

    await repo.create(
        report_id="rpt-test004",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )
    await repo.create(
        report_id="rpt-test005",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    reports = await repo.list_by_user(seed_user.id)
    assert len(reports) == 2

    count = await repo.count_by_user(seed_user.id)
    assert count == 2


@pytest.mark.asyncio
async def test_list_reports_empty(
    test_session: AsyncSession, seed_user
):
    """Test that listing reports for a user with no reports returns empty list."""
    repo = ResearchRepository(test_session)

    reports = await repo.list_by_user(seed_user.id)
    assert len(reports) == 0