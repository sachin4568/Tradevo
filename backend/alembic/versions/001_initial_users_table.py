"""Initial users table.

Revision ID: 001_initial_users
Revises: None
Create Date: 2026-07-01

Creates the users table for authentication (ENT-001).
This is the first migration and establishes the user entity
that all other entities reference via foreign keys.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers
revision: str = "001_initial_users"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(24), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(320), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "experience_level",
            sa.String(20),
            nullable=False,
            server_default="beginner",
        ),
        sa.Column(
            "risk_preference",
            sa.String(20),
            nullable=False,
            server_default="moderate",
        ),
        sa.Column("refresh_token_hash", sa.String(255), nullable=True),
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
    op.drop_table("users")