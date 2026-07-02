"""Generic Market Data Provider interface (BA-010).

Defines the abstract interface for all market data sources.
Business modules depend on this interface; concrete implementations
(NSE, Yahoo Finance, Alpha Vantage) are selected via factory.py.
"""

import abc
from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class PriceData:
    """Current price information for a single instrument."""

    symbol: str
    price: Decimal
    change: Decimal
    change_percent: Decimal
    currency: str = "INR"
    timestamp: str = ""


@dataclass
class CompanySummary:
    """Brief company information for search results."""

    id: str
    name: str
    symbol: str
    sector: str
    current_price: Decimal


@dataclass
class MarketOverview:
    """Top-level market summary with index data."""

    indices: list[dict[str, Any]]
    market_status: str  # "open", "closed", "pre_market", "post_market"


@dataclass
class SectorData:
    """Sector-level performance data."""

    sector: str
    change_percent: Decimal
    top_gainers: list[str]
    top_losers: list[str]


class MarketProvider(abc.ABC):
    """Abstract interface for market data providers.

    All market data backends (NSE, Yahoo Finance, Alpha Vantage, etc.)
    implement this interface. The market module's service depends on
    MarketProvider, never on a specific implementation.

    Provider selection is resolved at startup via factory.py
    based on the MARKET_PROVIDER configuration value.
    """

    @abc.abstractmethod
    async def get_company_price(self, symbol: str) -> PriceData:
        """Fetch the current price for a single company.

        Args:
            symbol: Stock ticker symbol (e.g., 'RELIANCE').

        Returns:
            PriceData with current price, change, and change percent.
        """
        ...

    @abc.abstractmethod
    async def get_market_overview(self) -> MarketOverview:
        """Fetch the current market overview with index data.

        Returns:
            MarketOverview with NIFTY 50, SENSEX, and market status.
        """
        ...

    @abc.abstractmethod
    async def get_sector_performance(self) -> list[SectorData]:
        """Fetch sector-level performance data.

        Returns:
            List of SectorData with performance metrics per sector.
        """
        ...

    @abc.abstractmethod
    async def search_companies(self, query: str) -> list[CompanySummary]:
        """Search for companies by name or symbol.

        Args:
            query: Search string (company name or ticker).

        Returns:
            List of matching CompanySummary objects.
        """
        ...

    @abc.abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider identifier (e.g., 'yahoo_finance', 'nse')."""
        ...

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Check if the market data provider is reachable and responsive."""
        ...
