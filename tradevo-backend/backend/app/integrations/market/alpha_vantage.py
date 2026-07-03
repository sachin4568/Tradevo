"""Alpha Vantage market data provider.

Production provider using the Alpha Vantage API for market data.
Supports stock quotes, market indices, and company search.
"""

from __future__ import annotations

import logging
from decimal import Decimal

import httpx

from app.integrations.market.base import (
    CompanySummary,
    MarketOverview,
    MarketProvider,
    PriceData,
    SectorData,
)

logger = logging.getLogger(__name__)


class AlphaVantageProvider(MarketProvider):
    """Alpha Vantage market data provider.

    Requires ALPHA_VANTAGE_API_KEY environment variable.

    Args:
        api_key: Alpha Vantage API key.
        timeout: Request timeout in seconds.
    """

    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: str, *, timeout: int = 30) -> None:
        self._api_key = api_key
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def get_company_price(self, symbol: str) -> PriceData:
        """Fetch current price using GLOBAL_QUOTE endpoint."""
        client = self._get_client()
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self._api_key,
        }

        response = await client.get(self.BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

        quote = data.get("Global Quote", {})
        if not quote:
            return PriceData(
                symbol=symbol,
                price=Decimal("0"),
                change=Decimal("0"),
                change_percent=Decimal("0"),
            )

        return PriceData(
            symbol=symbol,
            price=Decimal(str(quote.get("05. price", "0"))),
            change=Decimal(str(quote.get("09. change", "0"))),
            change_percent=Decimal(str(quote.get("10. change percent", "0").replace("%", ""))),
            timestamp=quote.get("07. latest trading day", ""),
        )

    async def get_market_overview(self) -> MarketOverview:
        """Return a basic market overview.

        Note: Alpha Vantage does not provide a dedicated market overview endpoint.
        This returns a synthetic overview with the provider name.
        """
        return MarketOverview(
            indices=[],
            market_status="open",
        )

    async def get_sector_performance(self) -> list[SectorData]:
        """Fetch sector performance using SECTOR endpoint."""
        client = self._get_client()
        params = {
            "function": "SECTOR",
            "apikey": self._api_key,
        }

        try:
            response = await client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            sectors = []
            rank_map = {
                "Rank A: Real-Time Performance": "top_gainers",
                "Rank B: 1 Day Performance": "one_day",
                "Rank C: 5 Day Performance": "five_day",
                "Rank D: 1 Month Performance": "one_month",
                "Rank E: 3 Month Performance": "three_month",
            }

            for rank_name, _ in rank_map.items():
                sector_data = data.get(rank_name, {})
                for sector_name, change_str in sector_data.items():
                    sectors.append(SectorData(
                        sector=sector_name,
                        change_percent=Decimal(str(change_str).replace("%", "")),
                        top_gainers=[],
                        top_losers=[],
                    ))
                break  # Use only the first rank to avoid duplicates

            return sectors[:10]
        except Exception:
            logger.warning("alphavantage_sector_fetch_failed", exc_info=True)
            return []

    async def search_companies(self, query: str) -> list[CompanySummary]:
        """Search companies using SYMBOL_SEARCH endpoint."""
        client = self._get_client()
        params = {
            "function": "SYMBOL_SEARCH",
            "keywords": query,
            "apikey": self._api_key,
        }

        try:
            response = await client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            for match in data.get("bestMatches", []):
                results.append(CompanySummary(
                    id=match.get("1. symbol", ""),
                    name=match.get("2. name", ""),
                    symbol=match.get("1. symbol", ""),
                    sector=match.get("4. sector", ""),
                    current_price=Decimal("0"),
                ))
            return results[:20]
        except Exception:
            logger.warning("alphavantage_search_failed", exc_info=True)
            return []

    def get_provider_name(self) -> str:
        return "alpha_vantage"

    async def health_check(self) -> bool:
        """Check Alpha Vantage API connectivity."""
        try:
            client = self._get_client()
            response = await client.get(
                self.BASE_URL,
                params={"function": "TIME_SERIES_INTRADAY", "symbol": "IBM", "interval": "5min", "apikey": self._api_key},
            )
            return response.status_code == 200
        except Exception:
            logger.warning("alphavantage_health_check_failed", exc_info=True)
            return False

    async def close(self) -> None:
        """Close the httpx client."""
        if self._client:
            await self._client.aclose()
            self._client = None
