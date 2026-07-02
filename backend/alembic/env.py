"""Alembic environment configuration.

Supports both synchronous (for offline/autogenerate) and asynchronous
(migration execution) database connections. The async engine is created
from the same configuration used by the application.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import get_settings
from app.core.database import Base

# Alembic Config object
config = context.config

# Set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic can detect them for autogeneration
# Each module must be imported before metadata is accessed
from app.modules.auth.models import User  # noqa: E402, F401
from app.modules.market.models import Company, MarketSnapshot, NewsArticle  # noqa: E402, F401
from app.modules.portfolio.models import Holding, Portfolio, Transaction  # noqa: E402, F401
from app.modules.learning.models import LearningSession  # noqa: E402, F401
from app.modules.ai.models import DecisionTimeline  # noqa: E402, F401

target_metadata = Base.metadata


def get_url() -> str:
    """Get the database URL from application settings."""
    settings = get_settings()
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Generates SQL scripts without connecting to the database.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Execute migration operations on a live connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async database connection."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online migrations."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
