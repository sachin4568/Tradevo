"""Streaming-ready interfaces (BA-017).

Defines abstract interfaces for streaming AI responses.
These are INTERFACES ONLY — no implementation is provided
in this milestone. Implementations will be added in later
milestones when user-facing AI features are built.

The interfaces ensure the AI Execution Platform can support
streaming without architectural changes later.
"""

from __future__ import annotations

import abc
from collections.abc import AsyncGenerator
from typing import Any

from app.integrations.llm.base import GenerateConfig, Message, Tool
from app.modules.ai.schemas import StreamChunk, StreamSession


class StreamingProvider(abc.ABC):
    """Interface for LLM providers that support streaming.

    Concrete providers (OpenAI, Anthropic, Google) will implement
    this in addition to LLMProvider when streaming is needed.
    """

    @abc.abstractmethod
    async def stream_generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream a single-prompt response as chunks.

        Yields StreamChunk objects until the response is complete.

        Args:
            prompt: The prompt to send.
            context: Additional context data.
            config: Generation parameters.

        Yields:
            StreamChunk with incremental content.
        """
        yield  # type: ignore[misc]

    @abc.abstractmethod
    async def stream_chat(
        self,
        messages: list[Message],
        tools: list[Tool] | None = None,
        config: GenerateConfig | None = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream a multi-turn chat response as chunks.

        Yields StreamChunk objects until the response is complete.

        Args:
            messages: Conversation history.
            tools: Optional tool definitions.
            config: Generation parameters.

        Yields:
            StreamChunk with incremental content.
        """
        yield  # type: ignore[misc]


class StreamingRequestManager(abc.ABC):
    """Interface for the streaming request orchestrator.

    Will be implemented in a future milestone. The interface
    is defined now so the AI Execution Platform can be extended
    without breaking changes.
    """

    @abc.abstractmethod
    async def start_stream(
        self,
        prompt_key: str,
        context: dict[str, Any],
        *,
        prompt_version: int = 1,
    ) -> StreamSession:
        """Start a streaming AI request.

        Returns:
            StreamSession with correlation_id and initial status.
        """
        ...

    @abc.abstractmethod
    async def get_stream(
        self,
        correlation_id: str,
    ) -> AsyncGenerator[StreamChunk, None]:
        """Get the stream for an active session.

        Yields StreamChunk objects as they arrive.

        Args:
            correlation_id: The correlation ID from start_stream.

        Yields:
            StreamChunk with incremental content.
        """
        yield  # type: ignore[misc]

    @abc.abstractmethod
    async def cancel_stream(self, correlation_id: str) -> bool:
        """Cancel an active streaming session.

        Returns:
            True if the session was cancelled, False if not found.
        """
        ...
