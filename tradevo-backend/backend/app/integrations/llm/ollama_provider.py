"""Ollama LLM provider.

Production-ready adapter for local Ollama instances.
Uses httpx for HTTP calls to the Ollama REST API.
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


class OllamaProvider(LLMProvider):
    """Ollama local LLM provider.

    Connects to a local Ollama instance. No API key required.

    Args:
        model: Model name available in Ollama (e.g. 'llama3', 'mistral').
        base_url: Ollama server URL (default: http://localhost:11434).
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        model: str = "llama3",
        *,
        base_url: str = "http://localhost:11434",
        timeout: int = 120,
        api_key: str | None = None,
    ) -> None:
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        """Lazy-initialize the httpx async client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=self._timeout,
            )
        return self._client

    async def _generate_ollama(
        self,
        prompt: str,
        system: str = "",
        config: GenerateConfig | None = None,
    ) -> dict[str, Any]:
        """Make a generation request to Ollama."""
        cfg = config or GenerateConfig()
        client = self._get_client()

        payload: dict[str, Any] = {
            "model": cfg.model or self._model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": cfg.temperature,
                "num_predict": cfg.max_tokens,
            },
        }
        if system:
            payload["system"] = system

        response = await client.post("/api/generate", json=payload)
        response.raise_for_status()
        return response.json()

    async def _chat_ollama(
        self,
        messages: list[dict[str, str]],
        config: GenerateConfig | None = None,
    ) -> dict[str, Any]:
        """Make a chat request to Ollama."""
        cfg = config or GenerateConfig()
        client = self._get_client()

        payload: dict[str, Any] = {
            "model": cfg.model or self._model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": cfg.temperature,
                "num_predict": cfg.max_tokens,
            },
        }

        response = await client.post("/api/chat", json=payload)
        response.raise_for_status()
        return response.json()

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion."""
        cfg = config or GenerateConfig()

        context_str = "\n".join(f"{k}: {v}" for k, v in context.items()) if context else ""
        full_prompt = f"{prompt}\n\n{context_str}" if context_str else prompt

        data = await self._generate_ollama(full_prompt, config=cfg)

        content = data.get("response", "")
        eval_count = data.get("eval_count", 0)
        prompt_eval_count = data.get("prompt_eval_count", 0)

        return LLMResponse(
            content=content,
            model=data.get("model", cfg.model or self._model),
            provider="ollama",
            usage={
                "prompt_tokens": prompt_eval_count,
                "completion_tokens": eval_count,
                "total_tokens": prompt_eval_count + eval_count,
            },
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
        data = await self._chat_ollama(api_messages, config=cfg)

        message_data = data.get("message", {})
        content = message_data.get("content", "")

        eval_count = data.get("eval_count", 0)
        prompt_eval_count = data.get("prompt_eval_count", 0)

        return LLMResponse(
            content=content,
            model=data.get("model", cfg.model or self._model),
            provider="ollama",
            usage={
                "prompt_tokens": prompt_eval_count,
                "completion_tokens": eval_count,
                "total_tokens": prompt_eval_count + eval_count,
            },
            raw_response=data,
        )

    def get_provider_name(self) -> str:
        return "ollama"

    async def health_check(self) -> bool:
        """Check Ollama server connectivity."""
        try:
            client = self._get_client()
            response = await client.get("/api/tags")
            response.raise_for_status()
            return True
        except Exception:
            logger.warning("ollama_health_check_failed", exc_info=True)
            return False

    async def close(self) -> None:
        """Close the httpx client."""
        if self._client:
            await self._client.aclose()
            self._client = None
