"""AI Execution Platform (Milestone 6, refined in 7.1).

Centralized AI infrastructure that all business modules use.
No business module ever interacts with AI providers directly.

Public API:
- AIRequestManager: Orchestrates all AI requests (retry, failover, caching, telemetry)
- AIProviderManager: Manages provider lifecycle and health
- ResponseComposer: Builds AIResponseEnvelope with provenance metadata
- create_provider_manager(): Factory for provider setup
- get_ai_cache() / reset_ai_cache(): Cache access
- get_ai_telemetry() / reset_ai_telemetry(): Telemetry access
- Prompt registry: get_prompt(), get_prompt_version(), register_version()

All AI responses are wrapped in AIResponseEnvelope before leaving
this module. Raw provider responses are never exposed.
"""

from app.modules.ai.cache.cache_layer import (
    AICache,
    AICacheBackend,
    InMemoryCacheBackend,
    get_ai_cache,
    reset_ai_cache,
)
from app.modules.ai.composer import ResponseComposer
from app.modules.ai.parsers.response_parser import AIResponseParser
from app.modules.ai.parsers.response_validator import AIResponseValidator
from app.modules.ai.provider_factory import create_provider_manager
from app.modules.ai.provider_manager import AIProviderManager
from app.modules.ai.request_manager import AIRequestManager
from app.modules.ai.schemas import (
    AIRequest,
    AIRequestStatus,
    AIRequestType,
    AIResponseEnvelope,
    AITelemetryEvent,
    StreamChunk,
    StreamSession,
    ValidationResult,
)
from app.modules.ai.telemetry import (
    AITelemetry,
    get_ai_telemetry,
    reset_ai_telemetry,
)

__all__ = [
    # Core orchestrator
    "AIRequestManager",
    # Response composition
    "ResponseComposer",
    # Provider management
    "AIProviderManager",
    "create_provider_manager",
    # Schemas
    "AIRequest",
    "AIRequestStatus",
    "AIRequestType",
    "AIResponseEnvelope",
    "AITelemetryEvent",
    "ValidationResult",
    "StreamChunk",
    "StreamSession",
    # Parsers
    "AIResponseParser",
    "AIResponseValidator",
    # Cache
    "AICache",
    "AICacheBackend",
    "InMemoryCacheBackend",
    "get_ai_cache",
    "reset_ai_cache",
    # Telemetry
    "AITelemetry",
    "get_ai_telemetry",
    "reset_ai_telemetry",
]