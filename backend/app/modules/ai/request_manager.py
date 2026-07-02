"""AI Request Manager (BA-010).

The central orchestrator for ALL AI requests in the platform.
Every AI call must go through the Request Manager. Business modules
never call providers directly.

Responsibilities:
- Request lifecycle management (correlation IDs, timing)
- Provider selection and failover
- Retry with exponential backoff
- Timeout handling (per-request)
- Response parsing and validation
- Cache integration
- Telemetry recording
- Raw response containment (never exposed outside AI layer)

Architecture:
  Business Module → AIRequestManager → ProviderManager → LLMProvider
                                    → AICache
                                    → AIResponseParser
                                    → AIResponseValidator
                                    → AITelemetry
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from typing import Any

from app.config import get_settings
from app.core.exceptions import LLMServiceUnavailableError
from app.integrations.llm.base import GenerateConfig, LLMResponse, Message, Tool
from app.modules.ai.cache.cache_layer import AICache, get_ai_cache
from app.modules.ai.parsers.response_parser import AIResponseParser
from app.modules.ai.parsers.response_validator import AIResponseValidator
from app.modules.ai.provider_manager import AIProviderManager
from app.modules.ai.prompt_registry import get_prompt, get_prompt_latest_version
from app.modules.ai.schemas import (
    AIRequest,
    AIRequestStatus,
    AIRequestType,
    AIResponseEnvelope,
    AITelemetryEvent,
    ParsedSection,
    ValidationResult,
)
from app.modules.ai.telemetry import AITelemetry, get_ai_telemetry

logger = logging.getLogger(__name__)


class AIRequestManager:
    """Central orchestrator for all AI requests.

    Usage:
        manager = AIRequestManager(provider_manager)
        response = await manager.generate(
            prompt_key="research.company_analysis",
            context={"company_name": "Reliance", ...},
        )
        # response is an AIResponseEnvelope — never raw provider output
    """

    def __init__(
        self,
        provider_manager: AIProviderManager,
        *,
        cache: AICache | None = None,
        telemetry: AITelemetry | None = None,
        parser: AIResponseParser | None = None,
        validator: AIResponseValidator | None = None,
        timeout: int | None = None,
        max_retries: int | None = None,
    ) -> None:
        self._provider_manager = provider_manager
        self._cache = cache or get_ai_cache()
        self._telemetry = telemetry or get_ai_telemetry()
        self._parser = parser or AIResponseParser()
        self._validator = validator or AIResponseValidator()

        settings = get_settings()
        self._timeout = timeout or settings.AI_TIMEOUT_SECONDS
        self._max_retries = max_retries or settings.AI_MAX_RETRIES

    async def generate(
        self,
        prompt_key: str,
        context: dict[str, Any],
        *,
        prompt_version: int | None = None,
        config: GenerateConfig | None = None,
        use_cache: bool = True,
        metadata: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope:
        """Generate an AI response (single prompt).

        This is the primary entry point for business modules.
        Handles the complete pipeline:
        1. Generate correlation ID
        2. Check cache
        3. Resolve prompt template
        4. Render prompt
        5. Select provider
        6. Execute with retry + failover
        7. Parse response
        8. Validate response
        9. Cache result
        10. Record telemetry

        Args:
            prompt_key: Registry key for the prompt template.
            context: Context variables for prompt rendering.
            prompt_version: Specific version (None = latest).
            config: Generation config (None = use settings).
            use_cache: Whether to check/populate cache.
            metadata: Additional metadata attached to the request.

        Returns:
            AIResponseEnvelope — the only type that leaves the AI layer.

        Raises:
            LLMServiceUnavailableError: If all providers fail.
        """
        # Step 1: Correlation ID
        correlation_id = self._generate_correlation_id()
        start_time = time.monotonic()

        # Step 2: Resolve prompt version
        if prompt_version is None:
            prompt_version = get_prompt_latest_version(prompt_key)

        # Step 3: Check cache
        if use_cache:
            cached = self._cache.get(
                prompt_key, context, prompt_version=prompt_version
            )
            if cached is not None and isinstance(cached, AIResponseEnvelope):
                self._record_telemetry(
                    correlation_id=correlation_id,
                    prompt_key=prompt_key,
                    prompt_version=prompt_version,
                    provider=cached.provider,
                    model=cached.model,
                    request_type=AIRequestType.GENERATE,
                    status=AIRequestStatus.CACHED,
                    duration_ms=int((time.monotonic() - start_time) * 1000),
                    prompt_tokens=0,
                    completion_tokens=0,
                    total_tokens=0,
                    cached=True,
                )
                # Return a copy marked as cached with new correlation ID
                return AIResponseEnvelope(
                    content=cached.content,
                    provider=cached.provider,
                    model=cached.model,
                    correlation_id=correlation_id,
                    prompt_key=cached.prompt_key,
                    prompt_version=cached.prompt_version,
                    parsed_sections=cached.parsed_sections,
                    validation=cached.validation,
                    usage=cached.usage,
                    metadata=cached.metadata,
                    cached=True,
                    duration_ms=int((time.monotonic() - start_time) * 1000),
                )

        # Step 4: Resolve and render prompt
        try:
            template = get_prompt(prompt_key)
        except KeyError:
            # Try versioned lookup
            from app.modules.ai.prompt_registry import get_prompt_version
            try:
                template = get_prompt_version(prompt_key, prompt_version)
            except KeyError:
                self._record_telemetry_failure(
                    correlation_id, prompt_key, prompt_version,
                    AIRequestType.GENERATE, start_time,
                    error=f"Prompt '{prompt_key}' v{prompt_version} not found",
                )
                raise LLMServiceUnavailableError(
                    message=f"Prompt template '{prompt_key}' not found"
                )

        rendered = template.render(context)

        # Step 5: Build request config
        settings = get_settings()
        gen_config = config or GenerateConfig(
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            model=settings.LLM_MODEL,
        )

        # Step 6: Execute with retry + failover
        llm_response, provider_name, retry_count = await self._execute_with_retry(
            rendered, context, gen_config, correlation_id, prompt_key, start_time
        )

        duration_ms = int((time.monotonic() - start_time) * 1000)

        # Step 7: Parse response
        parsed = self._parser.parse(
            llm_response.content,
            prompt_key=prompt_key,
        )

        # Step 8: Validate response
        validation = self._validator.validate(
            parsed.content,
            prompt_key=prompt_key,
            context=context,
        )

        # Use sanitized content if validation produced it
        final_content = validation.sanitized_content or parsed.content

        # Step 9: Build envelope
        envelope = AIResponseEnvelope(
            content=final_content,
            provider=provider_name,
            model=llm_response.model,
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            prompt_version=prompt_version,
            parsed_sections=parsed.sections,
            validation=validation,
            usage=llm_response.usage,
            metadata=metadata or {},
            cached=False,
            duration_ms=duration_ms,
        )

        # Step 10: Cache result
        if use_cache and validation.is_valid:
            self._cache.set(
                prompt_key, context, envelope, prompt_version=prompt_version
            )

        # Step 11: Record telemetry
        self._record_telemetry(
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            prompt_version=prompt_version,
            provider=provider_name,
            model=llm_response.model,
            request_type=AIRequestType.GENERATE,
            status=AIRequestStatus.COMPLETED if validation.is_valid else AIRequestStatus.FAILED,
            duration_ms=duration_ms,
            prompt_tokens=llm_response.usage.get("prompt_tokens", 0),
            completion_tokens=llm_response.usage.get("completion_tokens", 0),
            total_tokens=llm_response.usage.get("total_tokens", 0),
            cached=False,
            error=";".join(validation.errors) if validation.errors else None,
            retry_count=retry_count,
        )

        return envelope

    async def chat(
        self,
        messages: list[Message],
        tools: list[Tool] | None = None,
        *,
        prompt_key: str = "",
        config: GenerateConfig | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AIResponseEnvelope:
        """Generate an AI response from a multi-turn conversation.

        Follows the same pipeline as generate() but uses the chat
        interface of the LLM provider. No caching for chat (stateful).
        """
        correlation_id = self._generate_correlation_id()
        start_time = time.monotonic()

        settings = get_settings()
        gen_config = config or GenerateConfig(
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            model=settings.LLM_MODEL,
        )

        # Convert messages to dicts for provider call
        message_dicts = [{"role": m.role, "content": m.content} for m in messages]

        # Execute with retry + failover
        llm_response, provider_name, retry_count = await self._execute_chat_with_retry(
            messages, tools, gen_config, correlation_id, prompt_key, start_time
        )

        duration_ms = int((time.monotonic() - start_time) * 1000)

        # Parse and validate
        parsed = self._parser.parse(
            llm_response.content,
            prompt_key=prompt_key or "chat",
        )
        validation = self._validator.validate(parsed.content, prompt_key=prompt_key)
        final_content = validation.sanitized_content or parsed.content

        envelope = AIResponseEnvelope(
            content=final_content,
            provider=provider_name,
            model=llm_response.model,
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            parsed_sections=parsed.sections,
            validation=validation,
            usage=llm_response.usage,
            metadata=metadata or {},
            duration_ms=duration_ms,
        )

        self._record_telemetry(
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            provider=provider_name,
            model=llm_response.model,
            request_type=AIRequestType.CHAT,
            status=AIRequestStatus.COMPLETED,
            duration_ms=duration_ms,
            prompt_tokens=llm_response.usage.get("prompt_tokens", 0),
            completion_tokens=llm_response.usage.get("completion_tokens", 0),
            total_tokens=llm_response.usage.get("total_tokens", 0),
            retry_count=retry_count,
        )

        return envelope

    async def _execute_with_retry(
        self,
        rendered_prompt: str,
        context: dict[str, Any],
        config: GenerateConfig,
        correlation_id: str,
        prompt_key: str,
        start_time: float,
    ) -> tuple[LLMResponse, str, int]:
        """Execute a generate request with retry and failover.

        Returns:
            Tuple of (LLMResponse, provider_name, retry_count).

        Raises:
            LLMServiceUnavailableError: If all providers and retries fail.
        """
        last_error: Exception | None = None
        total_retries = 0

        # Get initial provider
        primary_name = self._provider_manager.get_primary_name()
        if primary_name is None:
            raise LLMServiceUnavailableError(
                message="No AI providers available"
            )
        current_name = primary_name

        for attempt in range(self._max_retries + 1):
            # Check circuit breaker
            if self._provider_manager.is_circuit_open(current_name):
                # Try failover
                failover = self._provider_manager.get_failover_provider(current_name)
                if failover is not None:
                    current_name = self._provider_manager.get_primary_name() or current_name
                    continue
                raise LLMServiceUnavailableError(
                    message="All AI providers unavailable (circuits open)"
                )

            try:
                provider = self._provider_manager.get_provider(current_name)

                # Execute with timeout
                response = await asyncio.wait_for(
                    provider.generate(rendered_prompt, context, config),
                    timeout=self._timeout,
                )

                self._provider_manager.record_success(current_name)
                return response, current_name, total_retries

            except asyncio.TimeoutError:
                logger.warning(
                    "ai_request_timeout cid=%s provider=%s attempt=%d timeout=%d",
                    correlation_id, current_name, attempt + 1, self._timeout,
                )
                self._provider_manager.record_failure(current_name)
                last_error = LLMServiceUnavailableError(
                    message=f"AI request timed out after {self._timeout}s"
                )
            except LLMServiceUnavailableError:
                raise
            except Exception as exc:
                logger.warning(
                    "ai_request_error cid=%s provider=%s attempt=%d error=%s",
                    correlation_id, current_name, attempt + 1, str(exc),
                )
                self._provider_manager.record_failure(current_name)
                last_error = exc

            total_retries += 1

            # Exponential backoff before retry
            if attempt < self._max_retries:
                backoff = min(2 ** attempt, 10)  # Cap at 10s
                await asyncio.sleep(backoff)

                # Try failover if current provider circuit might open
                if self._provider_manager.is_circuit_open(current_name):
                    failover_provider = self._provider_manager.get_failover_provider(current_name)
                    if failover_provider is not None:
                        new_name = self._provider_manager.get_primary_name()
                        if new_name:
                            current_name = new_name

        raise LLMServiceUnavailableError(
            message=f"AI request failed after {total_retries} retries"
        )

    async def _execute_chat_with_retry(
        self,
        messages: list[Message],
        tools: list[Tool] | None,
        config: GenerateConfig,
        correlation_id: str,
        prompt_key: str,
        start_time: float,
    ) -> tuple[LLMResponse, str, int]:
        """Execute a chat request with retry and failover."""
        last_error: Exception | None = None
        total_retries = 0

        primary_name = self._provider_manager.get_primary_name()
        if primary_name is None:
            raise LLMServiceUnavailableError(
                message="No AI providers available"
            )
        current_name = primary_name

        for attempt in range(self._max_retries + 1):
            if self._provider_manager.is_circuit_open(current_name):
                failover = self._provider_manager.get_failover_provider(current_name)
                if failover is not None:
                    current_name = self._provider_manager.get_primary_name() or current_name
                    continue
                raise LLMServiceUnavailableError(
                    message="All AI providers unavailable (circuits open)"
                )

            try:
                provider = self._provider_manager.get_provider(current_name)
                response = await asyncio.wait_for(
                    provider.chat(messages, tools, config),
                    timeout=self._timeout,
                )
                self._provider_manager.record_success(current_name)
                return response, current_name, total_retries

            except asyncio.TimeoutError:
                logger.warning(
                    "ai_chat_timeout cid=%s provider=%s attempt=%d",
                    correlation_id, current_name, attempt + 1,
                )
                self._provider_manager.record_failure(current_name)
                last_error = LLMServiceUnavailableError(
                    message=f"AI chat timed out after {self._timeout}s"
                )
            except LLMServiceUnavailableError:
                raise
            except Exception as exc:
                logger.warning(
                    "ai_chat_error cid=%s provider=%s attempt=%d error=%s",
                    correlation_id, current_name, attempt + 1, str(exc),
                )
                self._provider_manager.record_failure(current_name)
                last_error = exc

            total_retries += 1
            if attempt < self._max_retries:
                backoff = min(2 ** attempt, 10)
                await asyncio.sleep(backoff)

                if self._provider_manager.is_circuit_open(current_name):
                    new_name = self._provider_manager.get_primary_name()
                    if new_name:
                        current_name = new_name

        raise LLMServiceUnavailableError(
            message=f"AI chat failed after {total_retries} retries"
        )

    def _generate_correlation_id(self) -> str:
        """Generate a unique correlation ID for an AI request."""
        return f"ai-{uuid.uuid4().hex[:16]}"

    def _record_telemetry(
        self,
        *,
        correlation_id: str,
        prompt_key: str,
        provider: str,
        model: str,
        request_type: AIRequestType,
        status: AIRequestStatus,
        duration_ms: int,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        cached: bool = False,
        error: str | None = None,
        retry_count: int = 0,
        circuit_breaker_open: bool = False,
        prompt_version: int = 1,
    ) -> None:
        """Record a telemetry event."""
        event = AITelemetryEvent(
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            provider=provider,
            model=model,
            request_type=request_type,
            status=status,
            duration_ms=duration_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cached=cached,
            error=error,
            retry_count=retry_count,
            circuit_breaker_open=circuit_breaker_open,
        )
        self._telemetry.record_event(event)

    def _record_telemetry_failure(
        self,
        correlation_id: str,
        prompt_key: str,
        prompt_version: int,
        request_type: AIRequestType,
        start_time: float,
        error: str,
    ) -> None:
        """Record a failure telemetry event."""
        self._record_telemetry(
            correlation_id=correlation_id,
            prompt_key=prompt_key,
            provider="unknown",
            model="unknown",
            request_type=request_type,
            status=AIRequestStatus.FAILED,
            duration_ms=int((time.monotonic() - start_time) * 1000),
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            error=error,
            prompt_version=prompt_version,
        )

    # ─── Convenience Methods ───

    def get_cache_stats(self) -> dict[str, Any]:
        """Get AI cache statistics."""
        return self._cache.stats()

    def get_telemetry_global(self) -> dict[str, Any]:
        """Get global AI telemetry statistics."""
        return self._telemetry.get_global_stats()

    def get_telemetry_provider(self, provider: str) -> dict[str, Any]:
        """Get provider-specific telemetry."""
        return self._telemetry.get_provider_stats(provider)

    def get_telemetry_prompt(self, prompt_key: str) -> dict[str, Any]:
        """Get prompt-specific telemetry."""
        return self._telemetry.get_prompt_stats(prompt_key)

    def get_provider_status(self) -> list[dict[str, Any]]:
        """Get the status of all registered providers."""
        return self._provider_manager.list_providers()