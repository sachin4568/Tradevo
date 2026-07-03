"""Watchlist API request schemas."""

from pydantic import BaseModel, Field


class AddWatchlistRequest(BaseModel):
    """Request body for adding a company to the watchlist."""

    companyId: str = Field(min_length=1, description="Company ID to watch")
    notes: str | None = Field(
        None,
        max_length=2000,
        description="Optional notes about why the company is being watched",
    )


class UpdateNotesRequest(BaseModel):
    """Request body for updating watchlist notes."""

    notes: str | None = Field(
        None,
        max_length=2000,
        description="Updated notes (null to clear)",
    )
