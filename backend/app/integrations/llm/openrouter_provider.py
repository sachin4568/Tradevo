"""OpenRouter LLM provider.

Production-ready adapter for OpenRouter's unified API.
Uses httpx for HTTP calls, compatible with OpenAI's chat completion format.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.integrations.llm.base import (
    GenerateConfig,
    LLMProvider,
    LLMResponse,
    Message,
    Tool,
)

logger = logging.getLogger(__name__)

_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class OpenRouterProvider(LLMProvider):
    """OpenRouter provider — access to multiple LLMs via a single API.

    Requires OPENROUTER_API_KEY environment variable.

    Args:
        api_key: OpenRouter API key.
        model: Model identifier (e.g. 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet').
        base_url: Custom base URL override.
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "openai/gpt-4o",
        *,
        base_url: str | None = None,
        timeout: int = 60,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = (base_url or _OPENROUTER_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        """Lazy-initialize the httpx async client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://tradevo.app",
                    "X-Title": "Tradevo",
                },
                timeout=self._timeout,
            )
        return self._client

    async def _chat_completion(
        self,
        messages: list[dict[str, str]],
        tools: list[Tool] | None = None,
        config: GenerateConfig | None = None,
    ) -> dict[str, Any]:
        """Make a chat completion request to OpenRouter."""
        cfg = config or GenerateConfig()
        client = self._get_client()

        payload: dict[str, Any] = {
            "model": cfg.model or self._model,
            "messages": messages,
            "temperature": cfg.temperature,
            "max_tokens": cfg.max_tokens,
        }
        if tools:
            payload["tools"] = [
                {"type": "function", "function": {"name": t.name, "description": t.description, "parameters": t.parameters}}
                for t in tools
            ]

        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        return response.json()

    def _extract_usage(self, data: dict[str, Any]) -> dict[str, int]:
        """Extract usage from OpenRouter response."""
        usage = data.get("usage", {})
        return {
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        }

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion."""
        cfg = config or GenerateConfig()

        context_str = "\n".join(f"{k}: {v}" for k, v in context.items()) if context else ""
        user_content = f"{prompt}\n\n{context_str}" if context_str else prompt

        data = await self._chat_completion(
            [{"role": "user", "content": user_content}], config=cfg
        )

        content = ""
        if data.get("choices"):
            content = data["choices"][0].get("message", {}).get("content", "") or ""

        return LLMResponse(
            content=content,
            model=data.get("model", cfg.model or self._model),
            provider="openrouter",
            usage=self._extract_usage(data),
            raw_response=data,
        )

    async def chat(
        self,
        messages: list[Message],
        tools: list[Tool] | None = None,
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion from a multi-turn conversation."""
        cfg = config or GenerateConfig()

        api_messages = [{"role": m.role, "content": m.content} for m in messages]
        data = await self._chat_completion(api_messages, tools=tools, config=cfg)

        content = ""
        if data.get("choices"):
            content = data["choices"][0].get("message", {}).get("content", "") or ""

        return LLMResponse(
            content=content,
            model=data.get("model", cfg.model or self._model),
            provider="openrouter",
            usage=self._extract_usage(data),
            raw_response=data,
        )

    def get_provider_name(self) -> str:
        return "openrouter"

    async def health_check(self) -> bool:
        """Check OpenRouter API connectivity."""
        try:
            client = self._get_client()
            response = await client.get("/models")
            response.raise_for_status()
            return True
        except Exception:
            logger.warning("openrouter_health_check_failed", exc_info=True)
            return False

    async def close(self) -> None:
        """Close the httpx client."""
        if self._client:
            await self._client.aclose()
            self._client = None