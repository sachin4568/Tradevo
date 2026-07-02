"""Market domain entities (ENT-002, ENT-003, ENT-004).

Company: Static company profile + current price + financials.
MarketSnapshot: Periodic snapshot of index data and sector performance.
NewsArticle: Financial news articles, optionally linked to a company.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Company(Base):
    """Company entity with profile, pricing, and financial data.

    Stores the static company profile along with the latest price
    and financial metrics. Price data is updated by the market data
    provider; financials are updated periodically.
    """

    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    symbol: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    sector: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    industry: Mapped[str] = mapped_column(String(200), nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), nullable=False)

    # Display string (e.g., "25,12,340 Cr")
    market_cap: Mapped[str] = mapped_column(String(50), nullable=False)

    # Price data
    current_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    previous_close: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    day_change: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    day_change_percent: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Valuation metrics
    pe: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    pb: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    dividend_yield: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)

    # 52-week range
    week52_high: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    week52_low: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    # Company profile
    description: Mapped[str] = mapped_column(Text, nullable=False)
    website: Mapped[str] = mapped_column(String(200), nullable=False)
    founded_year: Mapped[int] = mapped_column(Integer, nullable=False)
    employees: Mapped[int] = mapped_column(Integer, nullable=False)

    # Financial metrics
    revenue: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    net_profit: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    debt: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    cash_flow: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    roe: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    roa: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    promotor_holding: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    institutional_holding: Mapped[float] = mapped_column(
        Numeric(6, 2), nullable=False, default=0
    )
    public_holding: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
    )


class MarketSnapshot(Base):
    """Periodic snapshot of market-wide data.

    Stores the latest index values and sector performance for
    graceful degradation when the market provider is unavailable.
    """

    __tablename__ = "market_snapshots"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    indices: Mapped[dict] = mapped_column(JSON, nullable=False)
    sector_performance: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )


class NewsArticle(Base):
    """Financial news article, optionally linked to a company.

    When company_id is NULL, the article is a market-level news item.
    When set, it is company-specific news.
    """

    __tablename__ = "news_articles"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    company_id: Mapped[str | None] = mapped_column(
        String(24),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    headline: Mapped[str] = mapped_column(String(500), nullable=False)
    source: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sentiment: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
