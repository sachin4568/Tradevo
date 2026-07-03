"""Authentication API endpoints.

Register, login, token refresh, and user profile management.
Implements dual-token JWT authentication (access + refresh).
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
    description=(
        "Create a new Tradevo account. A portfolio with "
        "10,00,000 virtual cash is initialized automatically. "
        "Returns the user profile and an access token."
    ),
    responses={
        201: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Account created successfully",
                        "data": {
                            "user": {"id": "usr-abc123", "name": "John Doe", "email": "john@example.com"},
                            "accessToken": "eyJhbG...",
                        },
                    }
                }
            },
        },
        409: {"description": "Email already registered"},
        422: {"description": "Validation error (weak password, invalid email)"},
    },
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Register a new account and receive authentication tokens."""
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
    description=(
        "Authenticate with email and password. Returns the user profile "
        "and an access token. Use the access token in the Authorization "
        "header as a Bearer token for all subsequent requests."
    ),
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Login successful",
                        "data": {
                            "user": {"id": "usr-abc123", "name": "John Doe", "email": "john@example.com"},
                            "accessToken": "eyJhbG...",
                            "refreshToken": "eyJhbG...",
                        },
                    }
                }
            },
        },
        401: {"description": "Invalid email or password"},
    },
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Authenticate with email and password."""
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
    description=(
        "Exchange a valid refresh token for a new access token. "
        "The old refresh token is invalidated (rotation). "
        "A new refresh token is also issued."
    ),
    responses={
        200: {
            "description": "Token refreshed",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Token refreshed successfully",
                        "data": {"accessToken": "eyJhbG...", "refreshToken": "eyJhbG..."},
                    }
                }
            },
        },
        401: {"description": "Invalid or expired refresh token"},
    },
)
async def refresh_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Exchange a valid refresh token for a new access token."""
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
    description="Revoke the current refresh token. The access token remains valid until expiry.",
    responses={200: {"description": "Logged out successfully"}},
)
async def logout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Revoke the current refresh token."""
    service = AuthService(db)
    await service.logout(user_id=user.id)
    return ApiResponse(message="Logged out successfully", data=None)


# ─── User Profile Endpoints ───

users_router = APIRouter(tags=["Users"])


@users_router.get(
    "/profile",
    response_model=ApiResponse,
    summary="Get current user profile",
    description="Return the authenticated user's full profile including preferences.",
    responses={
        200: {
            "description": "User profile",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Operation successful",
                        "data": {
                            "id": "usr-abc123",
                            "name": "John Doe",
                            "email": "john@example.com",
                            "experienceLevel": "beginner",
                            "riskPreference": "moderate",
                        },
                    }
                }
            },
        }
    },
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
    description="Update the authenticated user's profile fields. Only provided fields are updated.",
    responses={200: {"description": "Profile updated"}, 422: {"description": "Validation error"}},
)
async def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Update the authenticated user's profile fields."""
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
