"""Add watchlist_items and research_reports tables.

Revision ID: 005_research_tables
Revises: 004_learning_tables
"""

import sqlalchemy as sa
from alembic import op

revision = "005_research_tables"
down_revision = "004_learning_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── watchlist_items table ──
    op.create_table(
        "watchlist_items",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(24),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
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
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
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
        sa.UniqueConstraint(
            "user_id",
            "company_id",
            name="uq_watchlist_user_company",
        ),
    )

    # ── research_reports table ──
    op.create_table(
        "research_reports",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(24),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
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
        sa.Column(
            "source_type",
            sa.String(20),
            nullable=False,
            server_default="manual",
        ),
        sa.Column(
            "summary",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "analysis",
            sa.JSON,
            nullable=True,
        ),
        sa.Column(
            "prompt_key",
            sa.String(100),
            nullable=True,
        ),
        sa.Column(
            "model_used",
            sa.String(50),
            nullable=True,
        ),
        sa.Column(
            "tokens_used",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "generation_time_ms",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
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


def downgrade() -> None:
    op.drop_table("research_reports")
    op.drop_table("watchlist_items")