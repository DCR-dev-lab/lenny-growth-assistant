"""
Health Probe API Route for The Lenny Growth Assistant.
Reports live status of Relational Database, Pgvector extension, and LLM Providers.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
import logging

from app.database import get_db
from app.providers.ollama_provider import OllamaProvider
from app.providers.cloud_provider import ClaudeProvider, OpenAIProvider
from app.config import get_settings

logger = logging.getLogger("api_health")
router = APIRouter(prefix="/api/health", tags=["Health"])
settings = get_settings()

@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health diagnostic endpoint reporting status across all infrastructure layers."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {"connected": False},
        "pgvector": {"installed": False, "chunk_count": 0},
        "llm_providers": {
            "default": settings.DEFAULT_PROVIDER,
            "ollama": {},
            "anthropic": {},
            "openai": {}
        }
    }

    # 1. Probe Database & Pgvector
    try:
        db_res = await db.execute(text("SELECT 1;"))
        if db_res.scalar() == 1:
            health_status["database"]["connected"] = True

        vec_res = await db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector';"))
        if vec_res.scalar_one_or_none():
            health_status["pgvector"]["installed"] = True
            
        count_res = await db.execute(text("SELECT COUNT(*) FROM transcript_chunks;"))
        health_status["pgvector"]["chunk_count"] = count_res.scalar() or 0
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"]["error"] = str(e)

    # 2. Probe Ollama
    try:
        ollama = OllamaProvider()
        health_status["llm_providers"]["ollama"] = await ollama.check_health()
    except Exception as e:
        health_status["llm_providers"]["ollama"] = {"available": False, "error": str(e)}

    # 3. Probe Cloud Providers
    claude = ClaudeProvider()
    health_status["llm_providers"]["anthropic"] = await claude.check_health()

    openai = OpenAIProvider()
    health_status["llm_providers"]["openai"] = await openai.check_health()

    return health_status
