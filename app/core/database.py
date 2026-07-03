"""SQLAlchemy async engine, session factory, and declarative base.

This module provides the database infrastructure used by all repositories.
The engine and session factory are created from configuration and managed
via FastAPI dependency injection in dependencies.py.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models.

    All domain models in modules/*/models.py inherit from this Base.
    It provides the metadata registry that Alembic uses for autogeneration.
    """
    pass


def create_engine():
    """Create the async SQLAlchemy engine from configuration.

    Uses asyncpg driver. Pool size and overflow are configurable
    via DATABASE_POOL_SIZE and DATABASE_MAX_OVERFLOW environment variables.
    """
    settings = get_settings()
    return create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DATABASE_ECHO,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
    )


def create_session_factory(engine=None) -> async_sessionmaker[AsyncSession]:
    """Create the async session factory.

    The session factory produces AsyncSession instances with
    expire_on_commit=False to allow access to attributes after commit.
    """
    if engine is None:
        engine = create_engine()
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


# Module-level engine and session factory (initialized at startup)
_engine = None
_session_factory = None


def get_engine():
    """Return or create the module-level async engine."""
    global _engine
    if _engine is None:
        _engine = create_engine()
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return or create the module-level session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = create_session_factory(get_engine())
    return _session_factory
