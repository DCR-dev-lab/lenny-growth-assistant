"""
LLM Provider Factory for The Lenny Growth Assistant.
Handles dynamic runtime selection between Ollama, Claude, OpenAI, and Resilient Mock fallback.
"""

import logging
from typing import Optional
from app.config import get_settings
from app.providers.base import BaseLLMProvider
from app.providers.ollama_provider import OllamaProvider
from app.providers.cloud_provider import ClaudeProvider, OpenAIProvider
from app.providers.mock_provider import ResilientMockProvider

logger = logging.getLogger("provider_factory")
settings = get_settings()

def get_llm_provider(requested_provider: Optional[str] = None) -> BaseLLMProvider:
    provider_name = (requested_provider or settings.DEFAULT_PROVIDER).lower()
    
    if provider_name == "claude":
        if settings.ANTHROPIC_API_KEY:
            logger.info("Using Anthropic Claude Provider")
            return ClaudeProvider()
        else:
            logger.warning("Anthropic API key not found. Checking Ollama/Mock fallback...")
            return OllamaProvider()

    elif provider_name == "openai":
        if settings.OPENAI_API_KEY:
            logger.info("Using OpenAI Provider")
            return OpenAIProvider()
        else:
            logger.warning("OpenAI API key not found. Checking Ollama/Mock fallback...")
            return OllamaProvider()

    elif provider_name == "mock":
        logger.info("Using Resilient Mock Provider")
        return ResilientMockProvider()

    else:
        # Default to Ollama
        logger.info("Using Ollama Provider")
        return OllamaProvider()
