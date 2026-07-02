"""OpenAI LLM provider.

Production-ready adapter for OpenAI's chat completion API.
Uses the official openai Python SDK with async support.
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


class OpenAIProvider(LLMProvider):
    """OpenAI chat completion provider.

    Requires OPENAI_API_KEY environment variable or settings.LLM_API_KEY.

    Args:
        api_key: OpenAI API key.
        model: Model name (e.g. 'gpt-4o', 'gpt-4o-mini').
        base_url: Optional custom base URL (for proxies/Azure).
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
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
        """Lazy-initialize the OpenAI async client."""
        if self._client is None:
            import openai
            kwargs: dict[str, Any] = {
                "api_key": self._api_key,
                "timeout": self._timeout,
            }
            if self._base_url:
                kwargs["base_url"] = self._base_url
            self._client = openai.AsyncOpenAI(**kwargs)
        return self._client

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion using the chat completions API."""
        cfg = config or GenerateConfig()
        client = self._get_client()

        context_str = "\n".join(f"{k}: {v}" for k, v in context.items()) if context else ""
        user_content = f"{prompt}\n\n{context_str}" if context_str else prompt

        messages = [{"role": "user", "content": user_content}]
        response = await client.chat.completions.create(
            model=cfg.model or self._model,
            messages=messages,
            temperature=cfg.temperature,
            max_tokens=cfg.max_tokens,
        )

        choice = response.choices[0]
        usage = response.usage
        return LLMResponse(
            content=choice.message.content or "",
            model=response.model,
            provider="openai",
            usage={
                "prompt_tokens": usage.prompt_tokens if usage else 0,
                "completion_tokens": usage.completion_tokens if usage else 0,
                "total_tokens": usage.total_tokens if usage else 0,
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
            "messages": api_messages,
            "temperature": cfg.temperature,
            "max_tokens": cfg.max_tokens,
        }
        if tools:
            kwargs["tools"] = [
                {"type": "function", "function": {"name": t.name, "description": t.description, "parameters": t.parameters}}
                for t in tools
            ]

        response = await client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        usage = response.usage
        return LLMResponse(
            content=choice.message.content or "",
            model=response.model,
            provider="openai",
            usage={
                "prompt_tokens": usage.prompt_tokens if usage else 0,
                "completion_tokens": usage.completion_tokens if usage else 0,
                "total_tokens": usage.total_tokens if usage else 0,
            },
            raw_response=response,
        )

    def get_provider_name(self) -> str:
        return "openai"

    async def health_check(self) -> bool:
        """Check OpenAI API connectivity by listing models."""
        try:
            client = self._get_client()
            await client.models.list(limit=1)
            return True
        except Exception:
            logger.warning("openai_health_check_failed", exc_info=True)
            return False