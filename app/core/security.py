"""JWT token management and password hashing.

Implements the dual-token JWT system (BA-006):
- Access tokens: 15-minute lifetime, used for API authentication
- Refresh tokens: 7-day lifetime, stored hashed in database

Password security uses bcrypt via passlib with a minimum cost factor of 12.
"""

from datetime import UTC, datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.config import get_settings

# bcrypt context with configurable rounds
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt.

    The cost factor is controlled by BCRYPT_ROUNDS in configuration (default: 12).
    Only the hash is stored; the plaintext password is never persisted.
    """
    settings = get_settings()
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash.

    Returns True if the password matches, False otherwise.
    Uses constant-time comparison to prevent timing attacks.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: str,
    email: str,
) -> str:
    """Create a short-lived JWT access token.

    Claims:
        sub: User ID
        email: User email
        exp: Expiration timestamp (ACCESS_TOKEN_EXPIRE_MINUTES from now)
        iat: Issued-at timestamp
        type: "access"
        jti: Unique token identifier for revocation tracking
    """
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": now,
        "type": "access",
        "jti": f"atk-{user_id}-{int(now.timestamp())}",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    user_id: str,
    email: str,
) -> str:
    """Create a long-lived JWT refresh token.

    The refresh token allows obtaining new access tokens without
    re-authentication. It is stored hashed in the database and
    rotated on each use (old token invalidated, new one issued).
    """
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": now,
        "type": "refresh",
        "jti": f"rtk-{user_id}-{int(now.timestamp())}",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token.

    Returns the token payload if valid.
    Raises JWTError if the token is expired, malformed,
    or has an invalid signature.
    """
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def hash_token(token: str) -> str:
    """Hash a refresh token for database storage.

    Uses SHA-256 for token hashing (not bcrypt, since tokens are
    high-entropy and don't need slow hashing).
    """
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()
