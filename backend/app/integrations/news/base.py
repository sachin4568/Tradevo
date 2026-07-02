"""Generic News Provider interface.

Defines the abstract interface for all news data sources.
Concrete implementations (Google News, MarketWatch) are selected via factory.py.
"""

import abc
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class NewsArticle:
    """A single news article with metadata."""

    headline: str
    source: str
    url: str
    published_at: datetime
    company_ids: list[str] = field(default_factory=list)
    summary: str = ""
    sentiment: str | None = None  # "positive", "negative", "neutral"


class NewsProvider(abc.ABC):
    """Abstract interface for news providers.

    All news backends implement this interface. The research and
    market modules depend on NewsProvider, never on specific implementations.
    """

    @abc.abstractmethod
    async def get_latest_news(
        self,
        company_ids: list[str] | None = None,
        limit: int = 20,
    ) -> list[NewsArticle]:
        """Fetch the latest financial news.

        Args:
            company_ids: Optional filter for specific companies.
            limit: Maximum number of articles to return.

        Returns:
            List of NewsArticle objects, newest first.
        """
        ...

    @abc.abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider identifier."""
        ...

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Check if the news provider is reachable."""
        ...
