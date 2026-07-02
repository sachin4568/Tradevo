"""Shared utility functions used across the application."""

import uuid
from datetime import UTC, datetime


def generate_uuid() -> str:
    """Generate a new UUID4 string.

    Used for all entity IDs throughout the system.
    Returns a lowercase hex string without dashes for compactness,
    prefixed with a short identifier when used in specific contexts
    (e.g., 'usr-xxx' for users, 'co-xxx' for companies).
    """
    return uuid.uuid4().hex


def generate_entity_id(prefix: str = "") -> str:
    """Generate a prefixed entity ID.

    Args:
        prefix: Short prefix identifying the entity type (e.g., 'usr', 'co', 'txn').

    Returns:
        A string like 'usr-a1b2c3d4e5f6' or just a UUID hex if no prefix.
    """
    uid = generate_uuid()
    if prefix:
        return f"{prefix}-{uid[:12]}"
    return uid


def utcnow() -> datetime:
    """Return the current UTC datetime with timezone info.

    All timestamps in the system are stored as UTC.
    """
    return datetime.now(UTC)


def format_duration(seconds: float) -> str:
    """Format a duration in seconds to a human-readable string.

    Examples: '1h 23m', '45s', '2h 0m 5s'
    """
    if seconds < 60:
        return f"{int(seconds)}s"
    minutes = int(seconds // 60)
    seconds_remainder = int(seconds % 60)
    if minutes < 60:
        return f"{minutes}m {seconds_remainder}s"
    hours = int(minutes // 60)
    minutes_remainder = int(minutes % 60)
    return f"{hours}h {minutes_remainder}m"
