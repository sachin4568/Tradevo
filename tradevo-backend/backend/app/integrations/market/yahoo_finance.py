"""Yahoo Finance market data provider.

Production provider using Yahoo Finance for market data.
Uses httpx with the Yahoo Finance query API.
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

_YAHOO_QUERY_URL = "https://query1.finance.yahoo.com/v8/finance/chart"


class YahooFinanceProvider(MarketProvider):
    """Yahoo Finance market data provider.

    No API key required. Uses public Yahoo Finance endpoints.

    Args:
        timeout: Request timeout in seconds.
    """

    def __init__(self, *, timeout: int = 30) -> None:
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                headers={"User-Agent": "Tradevo/1.0"},
            )
        return self._client

    async def get_company_price(self, symbol: str) -> PriceData:
        """Fetch current price using the chart API."""
        client = self._get_client()

        try:
            yahoo_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") else symbol
            response = await client.get(
                _YAHOO_QUERY_URL,
                params={"symbol": yahoo_symbol, "interval": "1d", "range": "1d"},
            )
            response.raise_for_status()
            data = response.json()

            result = data.get("chart", {}).get("result", [])
            if not result:
                return PriceData(
                    symbol=symbol,
                    price=Decimal("0"),
                    change=Decimal("0"),
                    change_percent=Decimal("0"),
                )

            meta = result[0].get("meta", {})
            price = Decimal(str(meta.get("regularMarketPrice", 0)))
            prev_close = Decimal(str(meta.get("chartPreviousClose", meta.get("previousClose", 0))))
            change = price - prev_close
            change_pct = (change / prev_close * 100) if prev_close else Decimal("0")

            return PriceData(
                symbol=symbol,
                price=price,
                change=change,
                change_percent=change_pct.quantize(Decimal("0.01")),
                timestamp=str(meta.get("regularMarketTime", "")),
            )
        except Exception:
            logger.warning("yahoo_price_fetch_failed symbol=%s", symbol, exc_info=True)
            return PriceData(
                symbol=symbol,
                price=Decimal("0"),
                change=Decimal("0"),
                change_percent=Decimal("0"),
            )

    async def get_market_overview(self) -> MarketOverview:
        """Fetch NIFTY 50 and SENSEX overview."""
        indices = []
        for symbol, name in [("^NSEI", "NIFTY 50"), ("^BSESN", "SENSEX")]:
            try:
                price_data = await self.get_company_price(symbol)
                indices.append({
                    "name": name,
                    "value": float(price_data.price),
                    "change": float(price_data.change),
                    "changePercent": float(price_data.change_percent),
                })
            except Exception:
                pass

        return MarketOverview(
            indices=indices,
            market_status="open",
        )

    async def get_sector_performance(self) -> list[SectorData]:
        """Yahoo Finance doesn't provide a dedicated sector endpoint."""
        return []

    async def search_companies(self, query: str) -> list[CompanySummary]:
        """Search companies using Yahoo Finance autocomplete."""
        client = self._get_client()

        try:
            response = await client.get(
                "https://query1.finance.yahoo.com/v1/finance/search",
                params={"q": query, "quotesCount": 20, "newsCount": 0},
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("quotes", []):
                if item.get("quoteType") not in ("EQUITY", "MUTUALFUND"):
                    continue
                results.append(CompanySummary(
                    id=item.get("symbol", ""),
                    name=item.get("longname", item.get("shortname", "")),
                    symbol=item.get("symbol", ""),
                    sector=item.get("sector", ""),
                    current_price=Decimal(str(item.get("regularMarketPrice", 0) or 0)),
                ))
            return results
        except Exception:
            logger.warning("yahoo_search_failed query=%s", query, exc_info=True)
            return []

    def get_provider_name(self) -> str:
        return "yahoo_finance"

    async def health_check(self) -> bool:
        """Check Yahoo Finance API connectivity."""
        try:
            client = self._get_client()
            response = await client.get(
                _YAHOO_QUERY_URL,
                params={"symbol": "^NSEI", "interval": "1d", "range": "1d"},
            )
            return response.status_code == 200
        except Exception:
            logger.warning("yahoo_health_check_failed", exc_info=True)
            return False

    async def close(self) -> None:
        """Close the httpx client."""
        if self._client:
            await self._client.aclose()
            self._client = None
