"""
Cloud LLM Providers for The Lenny Growth Assistant.
Implements concrete drivers for Anthropic Claude (Claude 3.5 Sonnet) and OpenAI (GPT-4o).
"""

import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List
from app.providers.base import BaseLLMProvider
from app.config import get_settings

logger = logging.getLogger("cloud_provider")
settings = get_settings()

class ClaudeProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.model = model or settings.ANTHROPIC_MODEL
        self.endpoint = "https://api.anthropic.com/v1/messages"

    async def check_health(self) -> Dict[str, Any]:
        return {
            "available": bool(self.api_key),
            "configured": bool(self.api_key),
            "model": self.model,
            "provider": "anthropic"
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "[Anthropic Provider Error: ANTHROPIC_API_KEY is not configured in .env or environment.]"
            return

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        # Format messages for Anthropic (roles must alternate user/assistant)
        anthropic_msgs = []
        for m in messages:
            anthropic_msgs.append({
                "role": m.get("role", "user"),
                "content": m.get("content", "")
            })

        payload = {
            "model": self.model,
            "system": system_prompt,
            "messages": anthropic_msgs,
            "max_tokens": 4096,
            "temperature": temperature,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", self.endpoint, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        yield f"[Anthropic Error: HTTP {response.status_code} - {err_text.decode('utf-8', errors='ignore')}]"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            raw_data = line[6:].strip()
                            if raw_data == "[DONE]":
                                break
                            try:
                                event = json.loads(raw_data)
                                if event.get("type") == "content_block_delta":
                                    delta = event.get("delta", {})
                                    text = delta.get("text", "")
                                    if text:
                                        yield text
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Claude streaming failed: {e}")
            yield f"[Anthropic Stream Exception: {str(e)}]"

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    async def check_health(self) -> Dict[str, Any]:
        return {
            "available": bool(self.api_key),
            "configured": bool(self.api_key),
            "model": self.model,
            "provider": "openai"
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "[OpenAI Provider Error: OPENAI_API_KEY is not configured in .env or environment.]"
            return

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        formatted_msgs = [{"role": "system", "content": system_prompt}] + messages
        payload = {
            "model": self.model,
            "messages": formatted_msgs,
            "temperature": temperature,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", self.endpoint, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        yield f"[OpenAI Error: HTTP {response.status_code} - {err_text.decode('utf-8', errors='ignore')}]"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            raw_data = line[6:].strip()
                            if raw_data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(raw_data)
                                choices = chunk.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            yield f"[OpenAI Stream Exception: {str(e)}]"
