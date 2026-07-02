"""News provider factory.

Reads NEWS_PROVIDER from configuration and returns the corresponding
NewsProvider implementation.
"""

from app.config import get_settings
from app.integrations.news.base import NewsProvider


def create_news_provider() -> NewsProvider | None:
    """Create the news provider based on configuration.

    Returns None when NEWS_PROVIDER is 'none' or an unknown value.
    """
    provider_name = get_settings().NEWS_PROVIDER

    if provider_name == "mock":
        from app.integrations.news.mock import MockNewsProvider

        return MockNewsProvider()

    # Future providers:
    # if provider_name == "google_news":
    #     from app.integrations.news.google import GoogleNewsProvider
    #     return GoogleNewsProvider()

    return None
