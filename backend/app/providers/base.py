"""
Abstract Base LLM Provider Interface for The Lenny Growth Assistant.
Guarantees a unified streaming contract across local and cloud models.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        """
        Streams generated text tokens from the underlying model.
        
        :param messages: Conversation history formatted as [{'role': 'user'|'assistant', 'content': '...'}]
        :param system_prompt: Strict grounded system prompt or skill instructions.
        :param temperature: Sampling temperature.
        :return: AsyncGenerator yielding token strings incrementally.
        """
        pass

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Returns health/availability status of the model provider."""
        pass
