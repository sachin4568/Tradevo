"""Reusable Pydantic validators shared across schemas."""

import re
from typing import Annotated

from pydantic import BeforeValidator


def validate_password_strength(password: str) -> str:
    """Validate password meets minimum strength requirements.

    Requirements (per BACKEND_ARCHITECTURE.md Section 9.7):
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit

    Returns the password if valid, raises ValueError otherwise.
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    return password


StrongPassword = Annotated[str, BeforeValidator(validate_password_strength)]
"""Pydantic type alias that validates password strength on assignment."""
