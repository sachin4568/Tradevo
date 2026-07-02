"""Market data provider factory.

Reads MARKET_PROVIDER from configuration and returns the corresponding
MarketProvider implementation. Adding a new market data source requires:
1. A new implementation file (e.g., nse.py)
2. Adding the import and case to this factory

Zero changes to any business module code are needed.
"""

from app.config import get_settings
from app.integrations.market.base import MarketProvider


def create_market_provider() -> MarketProvider | None:
    """Create the market data provider based on configuration.

    Returns None when MARKET_PROVIDER is 'none' or an unknown value,
    allowing services to fall back to stored database data.
    """
    provider_name = get_settings().MARKET_PROVIDER

    if provider_name == "mock":
        from app.integrations.market.mock import MockMarketProvider

        return MockMarketProvider()

    # Future providers:
    # if provider_name == "yahoo_finance":
    #     from app.integrations.market.yahoo import YahooFinanceProvider
    #     return YahooFinanceProvider()
    # if provider_name == "nse":
    #     from app.integrations.market.nse import NSEProvider
    #     return NSEProvider()

    return None
