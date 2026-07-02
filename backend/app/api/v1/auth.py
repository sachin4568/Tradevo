"""Authentication API endpoints.

Implements the auth contract consumed by the frontend:
- POST /auth/register  →  { user, token }
- POST /auth/login     →  { user, token }
- POST /auth/refresh   →  { token }
- POST /auth/logout    →  { success, message }
- GET  /users/profile  →  { user }
- PATCH /users/profile →  { user }
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    UpdateProfileRequest,
)
from app.api.schemas.common import ApiResponse
from app.dependencies import get_current_user, get_db_session
from app.modules.auth.models import User
from app.modules.auth.service import AuthService

router = APIRouter(tags=["Authentication"])


@router.post(
    "/register",
    response_model=ApiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Register a new account and receive authentication tokens.

    Creates a user with the provided credentials and returns
    the user profile and an access token. A portfolio with
    10,00,000 virtual cash is initialized automatically.
    """
    service = AuthService(db)
    result = await service.register(
        name=body.name,
        email=body.email,
        password=body.password,
    )
    return ApiResponse(
        message="Account created successfully",
        data=result,
    )


@router.post(
    "/login",
    response_model=ApiResponse,
    summary="Authenticate and receive tokens",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Authenticate with email and password.

    Returns the user profile and an access token on success.
    """
    service = AuthService(db)
    result = await service.login(
        email=body.email,
        password=body.password,
    )
    return ApiResponse(
        message="Login successful",
        data=result,
    )


@router.post(
    "/refresh",
    response_model=ApiResponse,
    summary="Refresh access token",
)
async def refresh_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Exchange a valid refresh token for a new access token.

    The old refresh token is invalidated (rotation). A new refresh
    token is also issued and stored server-side.
    """
    service = AuthService(db)
    result = await service.refresh(refresh_token=body.refresh_token)
    return ApiResponse(
        message="Token refreshed successfully",
        data=result,
    )


@router.post(
    "/logout",
    response_model=ApiResponse,
    summary="Revoke refresh token",
)
async def logout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Revoke the current refresh token.

    The client should discard both tokens. The access token
    remains valid until expiry but cannot be refreshed.
    """
    service = AuthService(db)
    await service.logout(user_id=user.id)
    return ApiResponse(message="Logged out successfully", data=None)


# ─── User Profile Endpoints ───

users_router = APIRouter(tags=["Users"])


@users_router.get(
    "/profile",
    response_model=ApiResponse,
    summary="Get current user profile",
)
async def get_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Return the authenticated user's profile."""
    service = AuthService(db)
    profile = await service.get_user(user.id)
    return ApiResponse(data=profile)


@users_router.patch(
    "/profile",
    response_model=ApiResponse,
    summary="Update user profile",
)
async def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Update the authenticated user's profile fields.

    Only provided fields are updated. Omitted fields remain unchanged.
    """
    service = AuthService(db)
    profile = await service.update_profile(
        user_id=user.id,
        name=body.name,
        experience_level=body.experience_level,
        risk_preference=body.risk_preference,
    )
    return ApiResponse(
        message="Profile updated successfully",
        data=profile,
    )
