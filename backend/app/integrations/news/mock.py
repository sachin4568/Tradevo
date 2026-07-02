"""Mock news provider for development.

Returns hardcoded financial news articles matching the seed data.
Used when NEWS_PROVIDER=mock.
"""

from datetime import UTC, datetime

from app.integrations.news.base import NewsArticle as ProviderNews
from app.integrations.news.base import NewsProvider

_MARKET_NEWS = [
    ProviderNews(
        headline="RBI keeps repo rate unchanged at 6.5%",
        source="Economic Times",
        url="",
        published_at=datetime(2026, 6, 29, 10, 0, 0, tzinfo=UTC),
        company_ids=[],
        summary="The central bank maintained the benchmark lending rate, citing stable inflation trends.",
    ),
    ProviderNews(
        headline="FII net buyers for fifth consecutive session",
        source="Moneycontrol",
        url="",
        published_at=datetime(2026, 6, 29, 9, 30, 0, tzinfo=UTC),
        company_ids=[],
        summary="Foreign institutional investors bought shares worth Rs 3,200 crore in today's session.",
    ),
    ProviderNews(
        headline="India GDP growth projected at 7.2% for FY27",
        source="Reuters India",
        url="",
        published_at=datetime(2026, 6, 28, 14, 0, 0, tzinfo=UTC),
        company_ids=[],
        summary="The World Bank revised India's growth forecast upward citing strong domestic consumption.",
    ),
    ProviderNews(
        headline="Crude oil prices drop 2% on global demand concerns",
        source="Financial Express",
        url="",
        published_at=datetime(2026, 6, 28, 11, 0, 0, tzinfo=UTC),
        company_ids=[],
        summary="Brent crude fell below $78 per barrel amid weakening demand from major economies.",
    ),
    ProviderNews(
        headline="SEBI tightens F&O trading norms for retail investors",
        source="LiveMint",
        url="",
        published_at=datetime(2026, 6, 27, 16, 0, 0, tzinfo=UTC),
        company_ids=[],
        summary="The regulator proposed stricter margin requirements and position limits for individual traders.",
    ),
]


class MockNewsProvider(NewsProvider):
    """Development provider that returns hardcoded financial news.

    No external API calls are made.
    """

    async def get_latest_news(
        self,
        company_ids: list[str] | None = None,
        limit: int = 20,
    ) -> list[ProviderNews]:
        """Return hardcoded market news.

        Company-specific filtering is not supported in the mock;
        all articles are returned as market-level news.
        """
        return _MARKET_NEWS[:limit]

    def get_provider_name(self) -> str:
        return "mock"

    async def health_check(self) -> bool:
        return True
