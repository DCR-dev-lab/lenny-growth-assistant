"""
Unit tests for Dynamic LLM Provider Factory and Fallback Behaviors.
"""

try:
    import pytest
except ImportError:
    class DummyMark:
        @staticmethod
        def asyncio(f):
            return f
    class DummyPytest:
        mark = DummyMark()
    pytest = DummyPytest()
import asyncio
from app.providers.factory import get_llm_provider
from app.providers.ollama_provider import OllamaProvider
from app.providers.cloud_provider import ClaudeProvider, OpenAIProvider
from app.providers.mock_provider import ResilientMockProvider

@pytest.mark.asyncio
async def test_provider_factory_routing():
    """Verifies factory returns appropriate provider classes."""
    ollama = get_llm_provider("ollama")
    assert isinstance(ollama, OllamaProvider)

    mock = get_llm_provider("mock")
    assert isinstance(mock, ResilientMockProvider)

@pytest.mark.asyncio
async def test_mock_provider_streaming():
    """Verifies mock provider streams tokens asynchronously."""
    provider = ResilientMockProvider()
    messages = [{"role": "user", "content": "How does Adam Fishman think about onboarding?"}]
    system_prompt = "You are Lenny Growth Assistant."

    tokens = []
    async for token in provider.generate_response(messages, system_prompt):
        tokens.append(token)

    full_text = "".join(tokens)
    assert len(tokens) > 5
    assert "Adam Fishman" in full_text
    assert "[Episode: Adam Fishman" in full_text

@pytest.mark.asyncio
async def test_mock_provider_out_of_domain_refusal():
    """Verifies mock provider refuses out of domain queries when instructed by system prompt."""
    provider = ResilientMockProvider()
    messages = [{"role": "user", "content": "How do I bake bread?"}]
    system_prompt = "no sufficient context available"

    tokens = []
    async for token in provider.generate_response(messages, system_prompt):
        tokens.append(token)

    full_text = "".join(tokens)
    assert "not have sufficient information" in full_text

@pytest.mark.asyncio
async def test_mock_provider_artifact_generation():
    """Verifies mock provider generates <artifact> tags when requested."""
    provider = ResilientMockProvider()
    messages = [{"role": "user", "content": "Generate an interactive HTML growth calculator"}]
    system_prompt = "You are Lenny Assistant."

    tokens = []
    async for token in provider.generate_response(messages, system_prompt):
        tokens.append(token)

    full_text = "".join(tokens)
    assert "<artifact type=\"html\"" in full_text
    assert "</artifact>" in full_text
