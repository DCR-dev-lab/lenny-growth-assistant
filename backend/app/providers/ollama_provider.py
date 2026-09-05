"""
Ollama Provider for The Lenny Growth Assistant.
Connects asynchronously to the local Ollama daemon for local inference (llama3.2:3b, llama3.1:8b).
"""

import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List
from app.providers.base import BaseLLMProvider
from app.config import get_settings

logger = logging.getLogger("ollama_provider")
settings = get_settings()

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL

    async def check_health(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is online and whether the configured model is installed."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "available": True,
                        "base_url": self.base_url,
                        "configured_model": self.model,
                        "installed_models": models,
                        "has_model": any(self.model in m for m in models)
                    }
        except Exception as e:
            logger.debug(f"Ollama health probe offline: {e}")
        return {
            "available": False,
            "base_url": self.base_url,
            "configured_model": self.model,
            "installed_models": [],
            "has_model": False
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_ctx": 1536,
                "num_predict": 384
            }
        }

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    if response.status_code != 200:
                        err_msg = f"[Notice: Ollama is running, but model '{self.model}' is not yet pulled (HTTP {response.status_code}). Run 'docker exec -it lenny_ollama ollama pull {self.model}' to enable local inference. Seamlessly serving via Resilient Demo Provider in the interim.]\n\n"
                        logger.warning(err_msg)
                        yield err_msg
                        from app.providers.mock_provider import ResilientMockProvider
                        fallback = ResilientMockProvider()
                        async for token in fallback.generate_response(messages, system_prompt, temperature):
                            yield token
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            logger.warning(f"Ollama connection to {self.base_url} unavailable ({e}). Seamlessly engaging Resilient Demo Fallback.")
            from app.providers.mock_provider import ResilientMockProvider
            fallback = ResilientMockProvider()
            async for token in fallback.generate_response(messages, system_prompt, temperature):
                yield token
        except Exception as e:
            logger.error(f"Ollama stream exception: {e}. Engaging Resilient Demo Fallback.")
            from app.providers.mock_provider import ResilientMockProvider
            fallback = ResilientMockProvider()
            async for token in fallback.generate_response(messages, system_prompt, temperature):
                yield token
