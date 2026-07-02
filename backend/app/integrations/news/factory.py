"""News provider factory.

Reads NEWS_PROVIDER from configuration and returns the corresponding
NewsProvider implementation.
"""

import logging

from app.config import get_settings
from app.integrations.news.base import NewsProvider

logger = logging.getLogger(__name__)


def create_news_provider() -> NewsProvider | None:
    """Create the news provider based on configuration.

    Returns None when NEWS_PROVIDER is 'none' or an unknown value.
    """
    provider_name = get_settings().NEWS_PROVIDER
    settings = get_settings()

    if provider_name == "mock":
        from app.integrations.news.mock import MockNewsProvider
        return MockNewsProvider()

    if provider_name == "newsapi":
        api_key = settings.NEWS_API_ORG_KEY or settings.NEWS_API_KEY
        if not api_key:
            logger.warning("news_factory_newsapi_no_key")
            return None
        try:
            from app.integrations.news.newsapi_provider import NewsAPIProvider
            return NewsAPIProvider(
                api_key=api_key,
                timeout=settings.NEWS_API_ORG_TIMEOUT or settings.NEWS_TIMEOUT,
            )
        except ImportError:
            logger.warning("news_factory_newsapi_import_failed")
        except Exception:
            logger.exception("news_factory_newsapi_error")
        return None

    return None