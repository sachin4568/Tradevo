"""Add companies, market_snapshots, and news_articles tables.

Revision ID: 002_market_tables
Revises: 001_initial_users
Create Date: 2026-07-01

Creates the market domain entities (ENT-002, ENT-003, ENT-004):
- companies: company profiles with pricing and financials
- market_snapshots: periodic market overview snapshots
- news_articles: financial news, optionally linked to companies
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers
revision: str = "002_market_tables"
down_revision: Union[str, None] = "001_initial_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── companies ───
    op.create_table(
        "companies",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False, unique=True, index=True),
        sa.Column("sector", sa.String(50), nullable=False, index=True),
        sa.Column("industry", sa.String(200), nullable=False),
        sa.Column("exchange", sa.String(20), nullable=False),
        sa.Column("market_cap", sa.String(50), nullable=False),
        sa.Column("current_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("previous_close", sa.Numeric(12, 2), nullable=False),
        sa.Column("day_change", sa.Numeric(12, 2), nullable=False),
        sa.Column("day_change_percent", sa.Numeric(6, 2), nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=False),
        sa.Column("pe", sa.Numeric(8, 2), nullable=False),
        sa.Column("pb", sa.Numeric(8, 2), nullable=False),
        sa.Column("dividend_yield", sa.Numeric(6, 2), nullable=False),
        sa.Column("week52_high", sa.Numeric(12, 2), nullable=False),
        sa.Column("week52_low", sa.Numeric(12, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("website", sa.String(200), nullable=False),
        sa.Column("founded_year", sa.Integer(), nullable=False),
        sa.Column("employees", sa.Integer(), nullable=False),
        # Financial metrics
        sa.Column("revenue", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("net_profit", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("debt", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("cash_flow", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("roe", sa.Numeric(6, 2), nullable=False, server_default="0"),
        sa.Column("roa", sa.Numeric(6, 2), nullable=False, server_default="0"),
        sa.Column(
            "promotor_holding", sa.Numeric(6, 2), nullable=False, server_default="0"
        ),
        sa.Column(
            "institutional_holding",
            sa.Numeric(6, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "public_holding", sa.Numeric(6, 2), nullable=False, server_default="0"
        ),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ─── market_snapshots ───
    op.create_table(
        "market_snapshots",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("indices", postgresql.JSON(), nullable=False),
        sa.Column("sector_performance", postgresql.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ─── news_articles ───
    op.create_table(
        "news_articles",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "company_id",
            sa.String(24),
            sa.ForeignKey("companies.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("headline", sa.String(500), nullable=False),
        sa.Column("source", sa.String(200), nullable=False),
        sa.Column("url", sa.String(500), nullable=False, server_default=""),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("sentiment", sa.String(20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("news_articles")
    op.drop_table("market_snapshots")
    op.drop_table("companies")