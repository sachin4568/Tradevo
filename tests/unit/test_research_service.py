"""Unit tests for ResearchService (mock LLM)."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.research.service import ResearchService


@pytest.mark.asyncio
async def test_generate_report(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test generating a research report with the mock LLM."""
    service = ResearchService(test_session)

    report = await service.generate_report(
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    assert report["companyId"] == seed_company.id
    assert report["content"] != ""
    assert report["modelUsed"] == "mock-gpt-4o"
    assert report["tokensUsed"] > 0
    assert report["generationTimeMs"] >= 0


@pytest.mark.asyncio
async def test_generate_report_for_nonexistent_company_raises(
    test_session: AsyncSession, seed_user
):
    """Test that generating for a nonexistent company raises NotFoundError."""
    service = ResearchService(test_session)

    with pytest.raises(NotFoundError):
        await service.generate_report(
            user_id=seed_user.id,
            company_id="nonexistent-id",
        )


@pytest.mark.asyncio
async def test_get_report(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test retrieving a specific research report."""
    service = ResearchService(test_session)

    generated = await service.generate_report(
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    report = await service.get_report(seed_user.id, generated["id"])
    assert report["id"] == generated["id"]
    assert report["content"] != ""


@pytest.mark.asyncio
async def test_get_report_wrong_user_raises(
    test_session: AsyncSession, seed_user, seed_company, create_user
):
    """Test that getting another user's report raises NotFoundError."""
    service = ResearchService(test_session)

    generated = await service.generate_report(
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    other_user = await create_user("other2@test.com", "Other User")
    with pytest.raises(NotFoundError):
        await service.get_report(other_user.id, generated["id"])


@pytest.mark.asyncio
async def test_get_latest_report(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test getting the latest report for a company."""
    service = ResearchService(test_session)

    await service.generate_report(
        user_id=seed_user.id,
        company_id=seed_company.id,
    )
    await service.generate_report(
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    latest = await service.get_latest_report(seed_user.id, seed_company.id)
    assert latest is not None
    assert latest["companyId"] == seed_company.id


@pytest.mark.asyncio
async def test_get_latest_report_none(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test getting latest report returns None when no reports exist."""
    service = ResearchService(test_session)

    result = await service.get_latest_report(seed_user.id, seed_company.id)
    assert result is None


@pytest.mark.asyncio
async def test_list_reports(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test listing research reports with pagination."""
    service = ResearchService(test_session)

    await service.generate_report(
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    result = await service.list_reports(seed_user.id)
    assert result["total"] == 1
    assert len(result["reports"]) == 1


@pytest.mark.asyncio
async def test_list_prompts(
    test_session: AsyncSession, seed_user
):
    """Test listing available prompt templates."""
    service = ResearchService(test_session)

    prompts = await service.list_prompts()
    assert len(prompts) >= 4
    keys = [p["key"] for p in prompts]
    assert "research.company_analysis" in keys