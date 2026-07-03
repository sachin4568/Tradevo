"""Portfolio and Transaction API request/response schemas.

Request schemas validate incoming bodies.
Response schemas document the API contract for OpenAPI.
"""

from pydantic import BaseModel, Field

# ─── Request Schemas ───


class TradeRequest(BaseModel):
    """Trade execution request.

    Per user revision #4: frontend sends ONLY companyId and quantity.
    The backend fetches the execution price from MarketProvider.
    """

    companyId: str = Field(min_length=1, description="Company ID to trade")
    quantity: int = Field(gt=0, description="Number of shares to buy/sell")


# ─── Response Schemas (for OpenAPI documentation) ───


class HoldingResponse(BaseModel):
    """A holding position matching the frontend Holding type."""

    id: str = ""
    companyId: str
    companyName: str = ""
    symbol: str = ""
    sector: str = ""
    quantity: int
    avgPrice: float
    currentPrice: float = 0
    investedValue: float = 0
    currentValue: float = 0
    pnl: float = 0
    pnlPercent: float = 0
    lastUpdated: str = ""


class TransactionResponse(BaseModel):
    """A transaction record matching the frontend Transaction type."""

    id: str
    companyId: str
    companyName: str = ""
    symbol: str = ""
    action: str  # "buy" or "sell"
    quantity: int
    price: float
    total: float
    timestamp: str
    status: str = "COMPLETED"


class TradeResultResponse(BaseModel):
    """Composite response returned after trade execution (revision #6).

    Contains the transaction, updated portfolio, updated holding,
    and remaining cash so the frontend can update state atomically.
    """

    transaction: dict
    portfolio: dict
    holding: dict | None = None
    remainingCash: float


class PortfolioSummaryResponse(BaseModel):
    """Portfolio summary with computed metrics."""

    id: str
    userId: str
    virtualCash: float
    totalInvested: float
    totalReturns: float
    holdings: list[HoldingResponse]
    holdingsValue: float
    totalValue: float
    createdAt: str


class TransactionListResponse(BaseModel):
    """Paginated transaction history."""

    transactions: list[TransactionResponse]
    total: int
    limit: int
    offset: int
