"""Authentication request/response Pydantic schemas.

These schemas validate incoming requests and serialize outgoing responses
for the auth endpoints (register, login, refresh, logout, profile).

Request schemas enforce format validation at the API layer (first validation
barrier). Business rule validation happens at the service layer.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.validators import StrongPassword

# ─── Request Schemas ───


class RegisterRequest(BaseModel):
    """Registration request body.

    Validates:
    - name: required, min 2 chars
    - email: valid email format (via EmailStr)
    - password: 8+ chars, uppercase, lowercase, digit (via StrongPassword validator)
    """

    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: StrongPassword


class LoginRequest(BaseModel):
    """Login request body.

    Validates:
    - email: valid email format
    - password: non-empty string (strength validated at registration only)
    """

    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    """Token refresh request body.

    Contains the current refresh token to be exchanged for new tokens.
    """

    refresh_token: str


class UpdateProfileRequest(BaseModel):
    """Profile update request body.

    All fields are optional — only provided fields are updated.
    """

    name: str | None = Field(default=None, min_length=2, max_length=200)
    experience_level: Literal["beginner", "intermediate", "advanced"] | None = None
    risk_preference: Literal["conservative", "moderate", "aggressive"] | None = None


class ChangePasswordRequest(BaseModel):
    """Password change request body.

    Validates the new password meets strength requirements.
    """

    current_password: str = Field(min_length=1)
    new_password: StrongPassword


# ─── Response Schemas ───


class UserResponse(BaseModel):
    """User profile response matching the frontend User type.

    Field names use camelCase to match the existing frontend contract
    in types/auth.ts. ConfigDict(from_attributes=True) allows
    construction from SQLAlchemy model instances.
    """

    id: str
    name: str
    email: str
    experienceLevel: str = Field(alias="experience_level")
    riskPreference: str = Field(alias="risk_preference")
    createdAt: str = Field(alias="created_at")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class AuthResponse(BaseModel):
    """Authentication response matching the frontend AuthResponse type.

    The frontend expects exactly { user, token } — this schema
    ensures the contract is maintained.
    """

    user: UserResponse
    token: str


class TokenResponse(BaseModel):
    """Token-only response for refresh endpoint."""

    token: str
