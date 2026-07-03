"""Anthropic LLM provider.

Production-ready adapter for Anthropic's Messages API.
Uses the official anthropic Python SDK with async support.
"""

from __future__ import annotations

import logging
from typing import Any

from app.integrations.llm.base import (
    GenerateConfig,
    LLMProvider,
    LLMResponse,
    Message,
    Tool,
)

logger = logging.getLogger(__name__)


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider.

    Requires ANTHROPIC_API_KEY environment variable or settings.LLM_API_KEY.

    Args:
        api_key: Anthropic API key.
        model: Model name (e.g. 'claude-sonnet-4-20250514').
        base_url: Optional custom base URL.
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "claude-sonnet-4-20250514",
        *,
        base_url: str | None = None,
        timeout: int = 60,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = base_url
        self._timeout = timeout
        self._client: Any = None

    def _get_client(self) -> Any:
        """Lazy-initialize the Anthropic async client."""
        if self._client is None:
            import anthropic
            kwargs: dict[str, Any] = {
                "api_key": self._api_key,
                "timeout": self._timeout,
            }
            if self._base_url:
                kwargs["base_url"] = self._base_url
            self._client = anthropic.AsyncAnthropic(**kwargs)
        return self._client

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion using the Messages API."""
        cfg = config or GenerateConfig()
        client = self._get_client()

        context_str = "\n".join(f"{k}: {v}" for k, v in context.items()) if context else ""
        user_content = f"{prompt}\n\n{context_str}" if context_str else prompt

        response = await client.messages.create(
            model=cfg.model or self._model,
            max_tokens=cfg.max_tokens,
            temperature=cfg.temperature,
            messages=[{"role": "user", "content": user_content}],
        )

        content_text = ""
        for block in response.content:
            if block.type == "text":
                content_text += block.text

        return LLMResponse(
            content=content_text,
            model=response.model,
            provider="anthropic",
            usage={
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            },
            raw_response=response,
        )

    async def chat(
        self,
        messages: list[Message],
        tools: list[Tool] | None = None,
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion from a multi-turn conversation."""
        cfg = config or GenerateConfig()
        client = self._get_client()

        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        kwargs: dict[str, Any] = {
            "model": cfg.model or self._model,
            "max_tokens": cfg.max_tokens,
            "temperature": cfg.temperature,
            "messages": api_messages,
        }
        if tools:
            kwargs["tools"] = [
                {"name": t.name, "description": t.description, "input_schema": t.parameters}
                for t in tools
            ]

        response = await client.messages.create(**kwargs)

        content_text = ""
        for block in response.content:
            if block.type == "text":
                content_text += block.text

        return LLMResponse(
            content=content_text,
            model=response.model,
            provider="anthropic",
            usage={
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            },
            raw_response=response,
        )

    def get_provider_name(self) -> str:
        return "anthropic"

    async def health_check(self) -> bool:
        """Check Anthropic API connectivity."""
        try:
            client = self._get_client()
            await client.messages.create(
                model=self._model,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except Exception:
            logger.warning("anthropic_health_check_failed", exc_info=True)
            return False
