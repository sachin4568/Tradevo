"""Generic LLM Provider interface (BA-009).

Defines the abstract interface that all LLM implementations must satisfy.
The AI subsystem depends on this interface, never on concrete implementations.
Swapping from OpenAI to Anthropic requires only an environment variable change.
"""

import abc
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Message:
    """A single message in an LLM conversation."""

    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class Tool:
    """A tool definition for LLM function calling."""

    name: str
    description: str
    parameters: dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerateConfig:
    """Configuration for an LLM generation request."""

    temperature: float = 0.3
    max_tokens: int = 4096
    model: str | None = None


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider."""

    content: str
    model: str
    provider: str
    usage: dict[str, int] = field(default_factory=lambda: {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
    })
    raw_response: Any = None


class LLMProvider(abc.ABC):
    """Abstract interface for LLM providers.

    All LLM backends (OpenAI, Anthropic, Google, Ollama) implement
    this interface. The AI subsystem and its engines depend on
    LLMProvider, never on a specific implementation.

    Provider selection is resolved at startup via factory.py
    based on the LLM_PROVIDER configuration value.
    """

    @abc.abstractmethod
    async def generate(
        self,
        prompt: str,
        context: dict[str, Any],
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion from a single prompt.

        Args:
            prompt: The system/user prompt to send to the LLM.
            context: Additional context data to include.
            config: Generation parameters (temperature, max_tokens, model).

        Returns:
            Standardized LLMResponse with content and metadata.
        """
        ...

    @abc.abstractmethod
    async def chat(
        self,
        messages: list[Message],
        tools: list[Tool] | None = None,
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a completion from a multi-turn conversation.

        Args:
            messages: Conversation history (system, user, assistant).
            tools: Optional tool definitions for function calling.
            config: Generation parameters.

        Returns:
            Standardized LLMResponse with content and metadata.
        """
        ...

    @abc.abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider identifier (e.g., 'openai', 'anthropic')."""
        ...

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Check if the LLM provider is reachable and responsive."""
        ...
