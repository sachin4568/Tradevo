"""Third-party integration configuration (market data, news)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class IntegrationsSettings(BaseSettings):
    """External provider settings.

    MARKET_PROVIDER: active market data source (nse, alpha_vantage, yahoo_finance, mock)
    NEWS_PROVIDER: active news source (google_news, marketwatch, mock)

    Provider-specific API keys and base URLs are configured here.
    Adding a new provider requires only a new implementation file + factory update.
    """

    MARKET_PROVIDER: str = "mock"
    MARKET_API_KEY: str | None = None
    MARKET_API_BASE_URL: str = ""
    NEWS_PROVIDER: str = "mock"
    NEWS_API_KEY: str | None = None
    NEWS_API_BASE_URL: str = ""

    model_config = SettingsConfigDict(env_prefix="", env_file=".env")
