"""Add learning_sessions and decision_timelines tables.

Revision ID: 004_learning_tables
Revises: 003_portfolio_tables
"""

import sqlalchemy as sa
from alembic import op

revision = "004_learning_tables"
down_revision = "003_portfolio_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── learning_sessions table ──
    op.create_table(
        "learning_sessions",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(24),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "start_time",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "end_time",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column(
            "lesson_progress",
            sa.JSON,
            nullable=True,
        ),
        sa.Column(
            "companies_studied",
            sa.JSON,
            nullable=True,
        ),
        sa.Column(
            "simulated_trades_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "mistakes_identified",
            sa.JSON,
            nullable=True,
        ),
        sa.Column(
            "lessons_learned",
            sa.JSON,
            nullable=True,
        ),
        sa.Column(
            "improvement_summary",
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
    )

    # Revision #3: Partial unique index — only one ACTIVE session per user
    op.execute(
        "CREATE UNIQUE INDEX uq_learning_sessions_user_active "
        "ON learning_sessions (user_id) "
        "WHERE status = 'ACTIVE'"
    )

    # ── decision_timelines table ──
    op.create_table(
        "decision_timelines",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(24),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "transaction_id",
            sa.String(24),
            sa.ForeignKey("transactions.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "decision_type",
            sa.String(20),
            nullable=False,
        ),
        sa.Column(
            "company_id",
            sa.String(24),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "decision_time",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "user_action",
            sa.String(20),
            nullable=False,
        ),
        sa.Column(
            "ai_feedback",
            sa.String(),
            nullable=True,
        ),
        sa.Column(
            "market_context",
            sa.String(),
            nullable=True,
        ),
        sa.Column(
            "investment_outcome",
            sa.String(20),
            nullable=True,
        ),
        sa.Column(
            "outcome_score",
            sa.Numeric(6, 2),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("decision_timelines")
    op.drop_index("uq_learning_sessions_user_active", table_name="learning_sessions")
    op.drop_table("learning_sessions")