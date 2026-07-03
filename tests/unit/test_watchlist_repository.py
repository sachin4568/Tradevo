"""Unit tests for WatchlistRepository."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.watchlist.repository import WatchlistRepository


@pytest.mark.asyncio
async def test_create_and_list_watchlist_items(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test creating a watchlist item and listing by user."""
    repo = WatchlistRepository(test_session)

    item = await repo.create(
        item_id="wti-test001",
        user_id=seed_user.id,
        company_id=seed_company.id,
        notes="Interesting company",
    )

    assert item.id == "wti-test001"
    assert item.user_id == seed_user.id
    assert item.company_id == seed_company.id
    assert item.notes == "Interesting company"

    items = await repo.list_by_user(seed_user.id)
    assert len(items) == 1
    assert items[0].id == "wti-test001"


@pytest.mark.asyncio
async def test_get_by_user_and_company(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test fetching a watchlist item by (user, company) pair."""
    repo = WatchlistRepository(test_session)

    await repo.create(
        item_id="wti-test002",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    item = await repo.get_by_user_and_company(seed_user.id, seed_company.id)
    assert item is not None
    assert item.id == "wti-test002"


@pytest.mark.asyncio
async def test_update_notes(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test updating watchlist item notes."""
    repo = WatchlistRepository(test_session)

    item = await repo.create(
        item_id="wti-test003",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    updated = await repo.update_notes(item, "Updated notes")
    assert updated.notes == "Updated notes"


@pytest.mark.asyncio
async def test_delete_watchlist_item(
    test_session: AsyncSession, seed_user, seed_company
):
    """Test deleting a watchlist item."""
    repo = WatchlistRepository(test_session)

    item = await repo.create(
        item_id="wti-test004",
        user_id=seed_user.id,
        company_id=seed_company.id,
    )

    await repo.delete(item)
    items = await repo.list_by_user(seed_user.id)
    assert len(items) == 0