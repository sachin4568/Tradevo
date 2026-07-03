"""News API news provider.

Production provider using the NewsAPI.org service.
Requires an API key and supports company-specific news filtering.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.integrations.news.base import NewsArticle, NewsProvider

logger = logging.getLogger(__name__)


class NewsAPIProvider(NewsProvider):
    """NewsAPI.org news provider.

    Requires NEWS_API_KEY environment variable.

    Args:
        api_key: NewsAPI.org API key.
        timeout: Request timeout in seconds.
    """

    BASE_URL = "https://newsapi.org/v2"

    def __init__(self, api_key: str, *, timeout: int = 30) -> None:
        self._api_key = api_key
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                timeout=self._timeout,
                headers={"X-Api-Key": self._api_key},
            )
        return self._client

    async def get_latest_news(
        self,
        company_ids: list[str] | None = None,
        limit: int = 20,
    ) -> list[NewsArticle]:
        """Fetch latest financial news from NewsAPI."""
        client = self._get_client()
        articles: list[NewsArticle] = []

        try:
            from_date = (datetime.now(UTC) - timedelta(days=7)).strftime("%Y-%m-%d")

            if company_ids:
                for symbol in company_ids[:5]:
                    try:
                        response = await client.get(
                            "/everything",
                            params={
                                "q": symbol,
                                "from": from_date,
                                "sortBy": "publishedAt",
                                "pageSize": min(limit, 10),
                                "language": "en",
                            },
                        )
                        response.raise_for_status()
                        data = response.json()
                        for article_data in data.get("articles", []):
                            articles.append(self._parse_article(article_data, company_ids=[symbol]))
                    except Exception:
                        logger.warning("newsapi_fetch_failed symbol=%s", symbol, exc_info=True)
            else:
                response = await client.get(
                    "/top-headlines",
                    params={
                        "category": "business",
                        "country": "in",
                        "pageSize": limit,
                    },
                )
                response.raise_for_status()
                data = response.json()
                for article_data in data.get("articles", []):
                    articles.append(self._parse_article(article_data))

            return articles[:limit]
        except Exception:
            logger.warning("newsapi_fetch_failed", exc_info=True)
            return []

    @staticmethod
    def _parse_article(data: dict[str, Any], company_ids: list[str] | None = None) -> NewsArticle:
        """Parse a NewsAPI article into a NewsArticle."""
        published = data.get("publishedAt", "")
        try:
            pub_dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pub_dt = datetime.now(UTC)

        return NewsArticle(
            headline=data.get("title", ""),
            source=data.get("source", {}).get("name", "") if isinstance(data.get("source"), dict) else str(data.get("source", "")),
            url=data.get("url", ""),
            published_at=pub_dt,
            company_ids=company_ids or [],
            summary=data.get("description", "") or data.get("content", ""),
            sentiment=None,
        )

    def get_provider_name(self) -> str:
        return "newsapi"

    async def health_check(self) -> bool:
        """Check NewsAPI connectivity."""
        try:
            client = self._get_client()
            response = await client.get(
                "/top-headlines",
                params={"category": "business", "country": "in", "pageSize": 1},
            )
            return response.status_code == 200
        except Exception:
            logger.warning("newsapi_health_check_failed", exc_info=True)
            return False

    async def close(self) -> None:
        """Close the httpx client."""
        if self._client:
            await self._client.aclose()
            self._client = None
