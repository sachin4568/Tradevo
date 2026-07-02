"""Google Gemini LLM provider.

Production-ready adapter for Google's Generative AI API.
Uses the official google-generativeai Python SDK.
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


class GeminiProvider(LLMProvider):
    """Google Gemini provider.

    Requires GEMINI_API_KEY or LLM_API_KEY environment variable.

    Args:
        api_key: Google AI API key.
        model: Model name (e.g. 'gemini-2.0-flash').
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.0-flash",
        *,
        timeout: int = 60,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout
        self._client: Any = None
        self._model_instance: Any = None

    def _get_model(self, model_name: str | None = None) -> Any:
        """Lazy-initialize the Gemini model."""
        name = model_name or self._model
        if self._model_instance is None or self._model_instance._model_name != name:
            import google.generativeai as genai
            if self._client is None:
                genai.configure(api_key=self._api_key)
                self._client = genai
            self._model_instance = self._client.GenerativeModel(name)
        return self._model_instance

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion using the Gemini API."""
        cfg = config or GenerateConfig()
        model = self._get_model(cfg.model)

        context_str = "\n".join(f"{k}: {v}" for k, v in context.items()) if context else ""
        full_prompt = f"{prompt}\n\n{context_str}" if context_str else prompt

        import asyncio
        response = await asyncio.to_thread(
            model.generate_content,
            full_prompt,
            generation_config=self._client.types.GenerationConfig(
                temperature=cfg.temperature,
                max_output_tokens=cfg.max_tokens,
            ),
        )

        prompt_tokens = 0
        completion_tokens = 0
        if response.usage_metadata:
            prompt_tokens = response.usage_metadata.prompt_token_count or 0
            completion_tokens = response.usage_metadata.candidates_token_count or 0

        return LLMResponse(
            content=response.text or "",
            model=cfg.model or self._model,
            provider="gemini",
            usage={
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
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
        model = self._get_model(cfg.model)

        history = []
        for m in messages[:-1]:
            role = "user" if m.role == "user" else "model"
            history.append({"role": role, "parts": [m.content]})

        chat_session = model.start_chat(history=history)
        last_message = messages[-1].content if messages else ""

        import asyncio
        response = await asyncio.to_thread(chat_session.send_message, last_message)

        prompt_tokens = 0
        completion_tokens = 0
        if response.usage_metadata:
            prompt_tokens = response.usage_metadata.prompt_token_count or 0
            completion_tokens = response.usage_metadata.candidates_token_count or 0

        return LLMResponse(
            content=response.text or "",
            model=cfg.model or self._model,
            provider="gemini",
            usage={
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
            raw_response=response,
        )

    def get_provider_name(self) -> str:
        return "gemini"

    async def health_check(self) -> bool:
        """Check Gemini API connectivity."""
        try:
            model = self._get_model()
            import asyncio
            await asyncio.to_thread(model.generate_content, "ping")
            return True
        except Exception:
            logger.warning("gemini_health_check_failed", exc_info=True)
            return False