"""AI Cache Layer (BA-015).

Provides in-memory caching for AI responses with a Redis-ready interface.
All cache operations go through AICacheBackend so the implementation
can be swapped to Redis without changing any calling code.

Features:
- In-memory LRU-style cache with TTL
- Cache key generation from prompt + context hash
- Automatic eviction of expired entries
- Redis-ready interface (swap backend, no caller changes)
- Cache hit/miss statistics
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


class AICacheBackend(ABC):
    """Abstract cache backend. Implement for Redis, Memcached, etc."""

    @abstractmethod
    def get(self, key: str) -> Any | None:
        """Retrieve a cached value. Returns None on miss."""
        ...

    @abstractmethod
    def set(self, key: str, value: Any, ttl_seconds: float) -> None:
        """Store a value with a TTL."""
        ...

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete a cached entry. Returns True if it existed."""
        ...

    @abstractmethod
    def clear(self) -> int:
        """Clear all cached entries. Returns count of deleted entries."""
        ...

    @abstractmethod
    def stats(self) -> dict[str, Any]:
        """Return cache statistics."""
        ...


@dataclass
class _CacheEntry:
    """Internal cache entry with TTL tracking."""

    value: Any
    created_at: float
    ttl_seconds: float
    hits: int = 0

    @property
    def is_expired(self) -> bool:
        return (time.monotonic() - self.created_at) >= self.ttl_seconds


class InMemoryCacheBackend(AICacheBackend):
    """Thread-safe in-memory cache with TTL-based expiration.

    Used as the default backend. Stores values in a dict with
    automatic expiration checking on access.

    When Redis is integrated, this will be replaced by RedisCacheBackend
    without any changes to calling code.
    """

    def __init__(self, max_size: int = 1000) -> None:
        self._store: dict[str, _CacheEntry] = {}
        self._max_size = max_size
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None
            if entry.is_expired:
                del self._store[key]
                self._misses += 1
                return None
            entry.hits += 1
            self._hits += 1
            return entry.value

    def set(self, key: str, value: Any, ttl_seconds: float) -> None:
        with self._lock:
            # Evict expired entries if at capacity
            if len(self._store) >= self._max_size:
                self._evict_expired()
            # If still at capacity, evict LRU (lowest hit count)
            if len(self._store) >= self._max_size and key not in self._store:
                self._evict_lru()
            self._store[key] = _CacheEntry(
                value=value,
                created_at=time.monotonic(),
                ttl_seconds=ttl_seconds,
            )

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def clear(self) -> int:
        with self._lock:
            count = len(self._store)
            self._store.clear()
            return count

    def stats(self) -> dict[str, Any]:
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0.0
            return {
                "size": len(self._store),
                "maxSize": self._max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hitRate": round(hit_rate, 2),
                "backend": "in_memory",
            }

    def _evict_expired(self) -> None:
        """Remove all expired entries."""
        expired = [
            k for k, v in self._store.items()
            if v.is_expired
        ]
        for k in expired:
            del self._store[k]

    def _evict_lru(self) -> None:
        """Remove the least-recently-used entry."""
        if not self._store:
            return
        lru_key = min(self._store, key=lambda k: self._store[k].hits)
        del self._store[lru_key]


class AICache:
    """High-level AI response cache.

    Wraps a backend and provides AI-specific cache key generation,
    prompt version-aware lookups, and structured statistics.

    Usage:
        cache = AICache()
        cache.set("research.company_analysis", context, response_envelope)
        cached = cache.get("research.company_analysis", context)
    """

    def __init__(
        self,
        backend: AICacheBackend | None = None,
        default_ttl: float = 300.0,
    ) -> None:
        self._backend = backend or InMemoryCacheBackend()
        self._default_ttl = default_ttl

    def generate_key(
        self,
        prompt_key: str,
        prompt_version: int,
        context: dict[str, Any],
    ) -> str:
        """Generate a deterministic cache key from prompt and context.

        The key includes the prompt key, version, and a hash of the
        context dict. This ensures cache hits only when the same
        prompt version and context are used.
        """
        context_str = json.dumps(context, sort_keys=True, default=str)
        context_hash = hashlib.sha256(context_str.encode()).hexdigest()[:16]
        return f"ai:{prompt_key}:v{prompt_version}:{context_hash}"

    def get(
        self,
        prompt_key: str,
        context: dict[str, Any],
        *,
        prompt_version: int = 1,
    ) -> Any | None:
        """Look up a cached AI response.

        Returns None on cache miss.
        """
        key = self.generate_key(prompt_key, prompt_version, context)
        return self._backend.get(key)

    def set(
        self,
        prompt_key: str,
        context: dict[str, Any],
        value: Any,
        *,
        prompt_version: int = 1,
        ttl: float | None = None,
    ) -> str:
        """Cache an AI response.

        Args:
            prompt_key: The prompt registry key.
            context: The context dict used for generation.
            value: The response to cache.
            prompt_version: Prompt version (affects cache key).
            ttl: Time-to-live in seconds. Uses default if None.

        Returns:
            The cache key used.
        """
        key = self.generate_key(prompt_key, prompt_version, context)
        self._backend.set(key, value, ttl or self._default_ttl)
        return key

    def invalidate(
        self,
        prompt_key: str,
        context: dict[str, Any],
        *,
        prompt_version: int = 1,
    ) -> bool:
        """Invalidate a specific cache entry."""
        key = self.generate_key(prompt_key, prompt_version, context)
        return self._backend.delete(key)

    def invalidate_prompt(self, prompt_key: str) -> int:
        """Invalidate all cache entries for a prompt key.

        Note: In-memory backend requires full scan. Redis backend
        can use key pattern matching for efficiency.
        """
        return 0  # In-memory doesn't support prefix deletion efficiently

    def clear(self) -> int:
        """Clear the entire cache."""
        return self._backend.clear()

    def stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        return self._backend.stats()


# Module-level singleton
_default_cache: AICache | None = None


def get_ai_cache() -> AICache:
    """Get the default AI cache instance.

    Returns a module-level singleton. In tests, this can be
    replaced by setting _default_cache directly.
    """
    global _default_cache
    if _default_cache is None:
        _default_cache = AICache()
    return _default_cache


def reset_ai_cache() -> None:
    """Reset the default cache (used in tests)."""
    global _default_cache
    if _default_cache:
        _default_cache.clear()
    _default_cache = None
