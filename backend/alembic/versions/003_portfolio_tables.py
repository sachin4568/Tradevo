"""Add portfolio, holding, and transaction tables.

Revision ID: 003_portfolio_tables
Revises: 002_market_tables
"""

import sqlalchemy as sa
from alembic import op

revision = "003_portfolio_tables"
down_revision = "002_market_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "portfolios",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(24),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
            index=True,
        ),
        sa.Column("virtual_cash", sa.Numeric(15, 2), nullable=False, server_default="1000000.00"),
        sa.Column("total_invested", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("total_returns", sa.Numeric(15, 2), nullable=False, server_default="0"),
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

    op.create_table(
        "holdings",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "portfolio_id",
            sa.String(24),
            sa.ForeignKey("portfolios.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "company_id",
            sa.String(24),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("quantity", sa.Numeric(12, 0), nullable=False, server_default="0"),
        sa.Column("average_price", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column(
            "last_updated",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    op.create_table(
        "transactions",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "portfolio_id",
            sa.String(24),
            sa.ForeignKey("portfolios.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "company_id",
            sa.String(24),
            sa.ForeignKey("companies.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
        sa.Column("transaction_type", sa.String(10), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 0), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total", sa.Numeric(15, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="COMPLETED"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Unique constraint: one holding per (portfolio, company)
    op.create_unique_constraint(
        "uq_holdings_portfolio_company", "holdings", ["portfolio_id", "company_id"]
    )


def downgrade() -> None:
    op.drop_table("transactions")
    op.drop_table("holdings")
    op.drop_table("portfolios")
