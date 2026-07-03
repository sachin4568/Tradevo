"""Market API response schemas for OpenAPI documentation."""

from pydantic import BaseModel


class MarketIndexResponse(BaseModel):
    """A market index (NIFTY 50, SENSEX, etc.)."""

    name: str
    value: float
    change: float
    changePercent: float


class TopMoverResponse(BaseModel):
    """A top gaining or losing stock."""

    companyId: str
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float
    isGainer: bool


class SectorPerformanceResponse(BaseModel):
    """Sector-level performance data."""

    sector: str
    change: float
    changePercent: float


class MarketOverviewResponse(BaseModel):
    """Full market overview matching the frontend MarketOverview type."""

    status: str
    indices: list[MarketIndexResponse]
    topGainers: list[TopMoverResponse]
    topLosers: list[TopMoverResponse]
    sectorPerformance: list[SectorPerformanceResponse]


class MarketNewsResponse(BaseModel):
    """A market-level news article."""

    id: str
    companyId: str | None
    headline: str
    source: str
    url: str
    publishedAt: str
    summary: str
    sentiment: str | None


class MarketCalendarResponse(BaseModel):
    """A market calendar event (holiday, etc.)."""

    date: str
    event: str
    type: str
