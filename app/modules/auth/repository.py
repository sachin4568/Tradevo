"""AuthRepository — data access for User entity.

Provides database operations for user management and refresh token storage.
Follows the Repository Pattern defined in BACKEND_ARCHITECTURE.md Section 6.

Returns SQLAlchemy model instances. The service layer converts
models to Pydantic response schemas.
"""


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User


class AuthRepository:
    """Data access layer for the User entity.

    All database operations for user authentication are encapsulated here.
    The repository receives an AsyncSession via constructor injection;
    transaction boundaries are managed at the service layer.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: str) -> User | None:
        """Fetch a user by their primary key."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Fetch a user by email address.

        Used during login to look up credentials and during
        registration to enforce email uniqueness (BR-001).
        """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(
        self,
        id: str,
        name: str,
        email: str,
        password_hash: str,
    ) -> User:
        """Create a new user record.

        The User model defaults handle experience_level, risk_preference,
        and timestamps. The portfolio is created separately by the service
        layer to maintain cross-module coordination at the Application Layer.
        """
        user = User(
            id=id,
            name=name,
            email=email,
            password_hash=password_hash,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_refresh_token(self, user_id: str, token_hash: str | None) -> None:
        """Store or clear the refresh token hash for a user.

        When token_hash is None, the user's refresh token is effectively
        revoked (e.g., on logout or token rotation).
        """
        user = await self.get_by_id(user_id)
        if user is not None:
            user.refresh_token_hash = token_hash
            await self.db.flush()

    async def get_by_refresh_token_hash(self, token_hash: str) -> User | None:
        """Look up a user by their stored refresh token hash.

        Used during token refresh to validate the submitted refresh token
        against the stored hash.
        """
        result = await self.db.execute(
            select(User).where(User.refresh_token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def update_profile(
        self,
        user_id: str,
        name: str | None = None,
        experience_level: str | None = None,
        risk_preference: str | None = None,
    ) -> User | None:
        """Update a user's profile fields.

        Only provided (non-None) fields are updated. Returns the
        updated User model or None if not found.
        """
        user = await self.get_by_id(user_id)
        if user is None:
            return None
        if name is not None:
            user.name = name
        if experience_level is not None:
            user.experience_level = experience_level
        if risk_preference is not None:
            user.risk_preference = risk_preference
        await self.db.flush()
        return user
