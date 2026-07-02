"""User SQLAlchemy model (ENT-001).

The User entity represents a registered Tradevo user. It stores
authentication credentials, profile information, and the refresh token
hash for the dual-token JWT system.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(24),
        primary_key=True,
        default=lambda: f"usr-{uuid.uuid4().hex[:12]}",
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    experience_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="beginner",
    )
    risk_preference: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="moderate",
    )
    refresh_token_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
    )
