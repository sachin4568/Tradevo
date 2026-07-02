"""Watchlist API endpoints.

GET    /watchlist           → list watchlist items
POST   /watchlist           → add a company to watchlist
DELETE /watchlist/{item_id} → remove from watchlist
PATCH  /watchlist/{item_id} → update watchlist notes

All endpoints require authentication (Bearer token).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.common import ApiResponse
from app.api.schemas.watchlist import AddWatchlistRequest, UpdateNotesRequest
from app.dependencies import get_current_user, get_db_session
from app.modules.auth.models import User
from app.modules.watchlist.service import WatchlistService

router = APIRouter(tags=["Watchlist"])


@router.get(
    "",
    response_model=ApiResponse,
    summary="List watchlist items",
    description="Returns all companies the user is watching with current price data.",
)
async def list_watchlist(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get the authenticated user's watchlist."""
    service = WatchlistService(db)
    items = await service.list_items(user.id)
    return ApiResponse(
        message="Watchlist retrieved successfully",
        data=items,
    )


@router.post(
    "",
    response_model=ApiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add to watchlist",
    description="Add a company to the user's watchlist.",
)
async def add_to_watchlist(
    body: AddWatchlistRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Add a company to the authenticated user's watchlist."""
    service = WatchlistService(db)
    item = await service.add_item(user.id, body.companyId, notes=body.notes)
    await db.commit()
    return ApiResponse(
        message="Company added to watchlist",
        data=item,
        status_code=201,
    )


@router.delete(
    "/{item_id}",
    response_model=ApiResponse,
    summary="Remove from watchlist",
    description="Remove a company from the user's watchlist.",
)
async def remove_from_watchlist(
    item_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Remove a watchlist item."""
    service = WatchlistService(db)
    await service.remove_item(user.id, item_id)
    await db.commit()
    return ApiResponse(
        message="Company removed from watchlist",
        data=None,
    )


@router.patch(
    "/{item_id}",
    response_model=ApiResponse,
    summary="Update watchlist notes",
    description="Update the notes on a watchlist item.",
)
async def update_watchlist_notes(
    item_id: str,
    body: UpdateNotesRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Update notes on a watchlist item."""
    service = WatchlistService(db)
    item = await service.update_notes(user.id, item_id, body.notes)
    await db.commit()
    return ApiResponse(
        message="Watchlist notes updated",
        data=item,
    )