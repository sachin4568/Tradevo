"""AuthService — authentication business logic.

Enforces business rules BR-001 (unique email), BR-005 (initial virtual capital),
and the dual-token JWT authentication flow defined in BACKEND_ARCHITECTURE.md Section 9.

Services are the sole location for business logic. They receive dependencies
via constructor injection and raise domain exceptions from core.exceptions.
"""


from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DuplicateResourceError,
    InvalidCredentialsError,
    NotFoundError,
    TokenRevokedError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.core.utils import generate_entity_id
from app.modules.auth.models import User
from app.modules.auth.repository import AuthRepository
from app.modules.portfolio.repository import PortfolioRepository


class AuthService:
    """Authentication service handling registration, login, token refresh, and profile management.

    All business rules for authentication are enforced here. The service
    coordinates with the repository for data access and with core.security
    for credential and token management.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.repo = AuthRepository(db)

    async def register(
        self,
        name: str,
        email: str,
        password: str,
    ) -> dict:
        """Register a new user and issue initial tokens.

        Business rules enforced:
        - BR-001: Email must be unique across all users.
        - BR-005: Portfolio is created with 10,00,000 virtual cash.

        Steps:
        1. Check email uniqueness
        2. Hash password (bcrypt)
        3. Create User record
        4. Create Portfolio (BR-005) — portfolio module will handle this
           at the Application Layer; here we only create the user.
        5. Generate access + refresh tokens
        6. Store refresh token hash in database
        7. Commit transaction
        8. Return user data + access token

        Returns:
            dict with 'user' (dict) and 'token' (access token string)
        """
        # BR-001: Enforce unique email
        existing = await self.repo.get_by_email(email)
        if existing is not None:
            raise DuplicateResourceError(
                message="An account with this email already exists",
                error_code="EMAIL_ALREADY_EXISTS",
            )

        # Hash password
        hashed = hash_password(password)

        # Create user
        user_id = generate_entity_id("usr")
        user = await self.repo.create(
            id=user_id,
            name=name,
            email=email,
            password_hash=hashed,
        )

        # BR-005: Create portfolio with 10,00,000 virtual cash
        portfolio_repo = PortfolioRepository(self.repo.db)
        await portfolio_repo.create(
            portfolio_id=generate_entity_id("pfl"),
            user_id=user_id,
            virtual_cash=1_000_000.00,
        )

        # Generate tokens
        access_token = create_access_token(user.id, user.email)
        refresh_token = create_refresh_token(user.id, user.email)

        # Store refresh token hash
        await self.repo.update_refresh_token(user.id, hash_token(refresh_token))

        # Commit transaction
        await self.repo.db.commit()

        return {
            "user": self._user_to_dict(user),
            "token": access_token,
        }

    async def login(
        self,
        email: str,
        password: str,
    ) -> dict:
        """Authenticate a user and issue new tokens.

        Steps:
        1. Look up user by email
        2. Verify password hash
        3. Generate new access + refresh tokens
        4. Rotate refresh token (invalidate old, store new hash)
        5. Commit

        Returns:
            dict with 'user' (dict) and 'token' (access token string)

        Raises:
            InvalidCredentialsError: If email not found or password doesn't match.
        """
        user = await self.repo.get_by_email(email)
        if user is None:
            raise InvalidCredentialsError()

        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        # Generate tokens
        access_token = create_access_token(user.id, user.email)
        refresh_token = create_refresh_token(user.id, user.email)

        # Rotate refresh token
        await self.repo.update_refresh_token(user.id, hash_token(refresh_token))
        await self.repo.db.commit()

        return {
            "user": self._user_to_dict(user),
            "token": access_token,
        }

    async def refresh(self, refresh_token: str) -> dict:
        """Refresh an access token using a valid refresh token.

        Steps:
        1. Decode refresh token (verifies signature + expiry)
        2. Look up user by stored refresh token hash
        3. Verify token type is "refresh"
        4. Generate new access token
        5. Rotate refresh token (invalidate old, issue new)
        6. Commit

        Returns:
            dict with 'token' (new access token string)

        Raises:
            AuthenticationError: If token is invalid, expired, or revoked.
        """
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise InvalidCredentialsError(message="Invalid or expired refresh token") from None

        if payload.get("type") != "refresh":
            raise InvalidCredentialsError(message="Invalid token type")

        user_id = payload["sub"]
        token_hash = hash_token(refresh_token)

        user = await self.repo.get_by_refresh_token_hash(token_hash)
        if user is None or user.id != user_id:
            raise TokenRevokedError()

        # Generate new tokens
        new_access_token = create_access_token(user.id, user.email)
        new_refresh_token = create_refresh_token(user.id, user.email)

        # Rotate refresh token
        await self.repo.update_refresh_token(user.id, hash_token(new_refresh_token))
        await self.repo.db.commit()

        return {"token": new_access_token}

    async def logout(self, user_id: str) -> None:
        """Revoke the user's refresh token.

        Clears the stored refresh token hash, effectively revoking
        all existing refresh tokens for this user.
        """
        await self.repo.update_refresh_token(user_id, None)
        await self.repo.db.commit()

    async def get_user(self, user_id: str) -> dict:
        """Fetch user profile by ID.

        Returns:
            dict with user profile data

        Raises:
            NotFoundError: If user does not exist.
        """
        user = await self.repo.get_by_id(user_id)
        if user is None:
            raise NotFoundError(message="User not found")
        return self._user_to_dict(user)

    async def update_profile(
        self,
        user_id: str,
        name: str | None = None,
        experience_level: str | None = None,
        risk_preference: str | None = None,
    ) -> dict:
        """Update a user's profile.

        Only provided (non-None) fields are updated.
        Returns the updated user profile.

        Raises:
            NotFoundError: If user does not exist.
        """
        user = await self.repo.update_profile(
            user_id=user_id,
            name=name,
            experience_level=experience_level,
            risk_preference=risk_preference,
        )
        if user is None:
            raise NotFoundError(message="User not found")
        await self.repo.db.commit()
        return self._user_to_dict(user)

    @staticmethod
    def _user_to_dict(user: User) -> dict:
        """Convert a User SQLAlchemy model to a dictionary.

        This is the service layer's responsibility — converting ORM models
        to plain dicts that the API layer serializes into Pydantic schemas.
        """
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "experienceLevel": user.experience_level,
            "riskPreference": user.risk_preference,
            "createdAt": user.created_at.isoformat() if user.created_at else "",
        }
