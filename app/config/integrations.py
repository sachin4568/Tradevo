"""Third-party integration configuration (market data, news).

Production-ready settings with per-provider API keys,
base URLs, and timeouts.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class IntegrationsSettings(BaseSettings):
    """External provider settings.

    MARKET_PROVIDER: active market data source
        (mock, alpha_vantage, yahoo_finance)

    NEWS_PROVIDER: active news source
        (mock, newsapi)

    Provider-specific API keys and configuration are
    environment-driven. Adding a new provider requires
    only a new implementation file + factory update.
    """

    # ─── Market Data ───
    MARKET_PROVIDER: str = "mock"
    MARKET_API_KEY: str | None = None
    MARKET_API_BASE_URL: str = ""
    MARKET_TIMEOUT: int = 30

    # ─── Alpha Vantage ───
    ALPHA_VANTAGE_API_KEY: str | None = None
    ALPHA_VANTAGE_TIMEOUT: int = 30

    # ─── News ───
    NEWS_PROVIDER: str = "mock"
    NEWS_API_KEY: str | None = None
    NEWS_API_BASE_URL: str = ""
    NEWS_TIMEOUT: int = 30

    # ─── NewsAPI ───
    NEWS_API_ORG_KEY: str | None = None
    NEWS_API_ORG_TIMEOUT: int = 30

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
