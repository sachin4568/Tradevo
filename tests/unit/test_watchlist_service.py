"""Unit tests for WatchlistService."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, NotFoundError
from app.modules.watchlist.service import WatchlistService


@pytest.mark.asyncio
async def test_add_and_list_watchlist(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test adding a company to watchlist and listing items."""
    service = WatchlistService(test_session)

    result = await service.add_item(seed_user.id, seed_company.id, notes="Test note")
    assert result["companyId"] == seed_company.id
    assert result["symbol"] == seed_company.symbol
    assert result["notes"] == "Test note"

    items = await service.list_items(seed_user.id)
    assert len(items) == 1
    assert items[0]["symbol"] == seed_company.symbol


@pytest.mark.asyncio
async def test_add_duplicate_raises(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test that adding the same company twice raises DuplicateResourceError."""
    service = WatchlistService(test_session)

    await service.add_item(seed_user.id, seed_company.id)
    with pytest.raises(DuplicateResourceError):
        await service.add_item(seed_user.id, seed_company.id)


@pytest.mark.asyncio
async def test_add_nonexistent_company_raises(
    test_session: AsyncSession, seed_user
):
    """Test that adding a nonexistent company raises NotFoundError."""
    service = WatchlistService(test_session)

    with pytest.raises(NotFoundError):
        await service.add_item(seed_user.id, "nonexistent-id")


@pytest.mark.asyncio
async def test_remove_item(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test removing a watchlist item."""
    service = WatchlistService(test_session)

    item = await service.add_item(seed_user.id, seed_company.id)
    await service.remove_item(seed_user.id, item["id"])

    items = await service.list_items(seed_user.id)
    assert len(items) == 0


@pytest.mark.asyncio
async def test_update_notes(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test updating notes on a watchlist item."""
    service = WatchlistService(test_session)

    item = await service.add_item(seed_user.id, seed_company.id)
    updated = await service.update_notes(seed_user.id, item["id"], "New notes")

    assert updated["notes"] == "New notes"


@pytest.mark.asyncio
async def test_remove_wrong_user_raises(
    test_session: AsyncSession, seed_user, seed_company, create_user
):
    """Test that removing another user's item raises NotFoundError."""
    service = WatchlistService(test_session)

    item = await service.add_item(seed_user.id, seed_company.id)

    other_user = await create_user("other@test.com", "Other User")
    with pytest.raises(NotFoundError):
        await service.remove_item(other_user.id, item["id"])