"""Company API request/response schemas.

Request schemas validate incoming query parameters.
Response schemas document the API contract for OpenAPI.
"""

from pydantic import BaseModel, Field

# ─── Request Schemas ───


class ListCompaniesQuery(BaseModel):
    """Optional query parameters for GET /companies."""

    sector: str | None = Field(default=None, description="Filter by sector name")
    search: str | None = Field(
        default=None, description="Search by name, symbol, or sector"
    )


# ─── Response Schemas (for OpenAPI documentation) ───


class CompanyResponse(BaseModel):
    """Company summary matching the frontend Company type."""

    id: str
    name: str
    symbol: str
    sector: str
    industry: str
    exchange: str
    marketCap: str
    currentPrice: float
    previousClose: float
    dayChange: float
    dayChangePercent: float
    volume: int
    pe: float
    pb: float
    dividendYield: float
    week52High: float
    week52Low: float
    description: str
    website: str
    foundedYear: int
    employees: int


class CompanyFinancialsResponse(BaseModel):
    """Financial metrics for a company."""

    revenue: float
    netProfit: float
    debt: float
    cashFlow: float
    roe: float
    roa: float
    promotorHolding: float
    institutionalHolding: float
    publicHolding: float


class CompanyNewsResponse(BaseModel):
    """A news article associated with a company."""

    id: str
    companyId: str | None
    headline: str
    source: str
    url: str
    publishedAt: str
    summary: str
    sentiment: str | None


class CompanyDetailResponse(CompanyResponse):
    """Full company detail with financials and news."""

    financials: CompanyFinancialsResponse
    news: list[CompanyNewsResponse]
