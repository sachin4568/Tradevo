"""Shared FastAPI dependency providers.

These dependencies are injected into API endpoints via FastAPI's Depends().
They provide database sessions, authenticated user resolution, and
service instantiation with proper dependency injection.
"""

from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session_factory
from app.core.security import decode_token
from app.modules.auth.models import User
from app.modules.auth.repository import AuthRepository

# OAuth2 scheme extracts the Bearer token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an async SQLAlchemy session per request.

    The session is created at request start and automatically closed
    when the request completes. Transaction commit/rollback is managed
    at the service layer.
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Resolve the authenticated user from a JWT access token.

    This dependency is used by all protected endpoints. It:
    1. Decodes the JWT access token
    2. Extracts the user_id from the 'sub' claim
    3. Looks up the user in the database
    4. Returns the User model instance

    Raises:
        HTTPException(401): If the token is invalid, expired, or the user
        is not found. The error message is intentionally generic to
        prevent information leakage.
    """
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None

    # Verify token type
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Look up user
    repo = AuthRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user
