"""Market data provider factory.

Reads MARKET_PROVIDER from configuration and returns the corresponding
MarketProvider implementation. Adding a new market data source requires:
1. A new implementation file (e.g., nse.py)
2. Adding the import and case to this factory

Zero changes to any business module code are needed.
"""

import logging

from app.config import get_settings
from app.integrations.market.base import MarketProvider

logger = logging.getLogger(__name__)


def create_market_provider() -> MarketProvider | None:
    """Create the market data provider based on configuration.

    Returns None when MARKET_PROVIDER is 'none' or an unknown value,
    allowing services to fall back to stored database data.
    """
    provider_name = get_settings().MARKET_PROVIDER
    settings = get_settings()

    if provider_name == "mock":
        from app.integrations.market.mock import MockMarketProvider
        return MockMarketProvider()

    if provider_name == "alpha_vantage":
        api_key = settings.ALPHA_VANTAGE_API_KEY or settings.MARKET_API_KEY
        if not api_key:
            logger.warning("market_factory_alpha_vantage_no_key")
            return None
        try:
            from app.integrations.market.alpha_vantage import AlphaVantageProvider
            return AlphaVantageProvider(
                api_key=api_key,
                timeout=settings.ALPHA_VANTAGE_TIMEOUT,
            )
        except ImportError:
            logger.warning("market_factory_alpha_vantage_import_failed")
        except Exception:
            logger.exception("market_factory_alpha_vantage_error")
        return None

    if provider_name == "yahoo_finance":
        try:
            from app.integrations.market.yahoo_finance import YahooFinanceProvider
            return YahooFinanceProvider(timeout=settings.MARKET_TIMEOUT)
        except ImportError:
            logger.warning("market_factory_yahoo_import_failed")
        except Exception:
            logger.exception("market_factory_yahoo_error")
        return None

    return None