"""
Application Configuration and Settings for The Lenny Growth Assistant.
Uses Pydantic Settings for environment-driven configuration with sensible defaults.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # Relational & Vector Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password123@localhost:5432/lenny_assistant",
        description="Async PostgreSQL connection URL"
    )
    
    # LLM Providers
    DEFAULT_PROVIDER: str = Field(
        default="ollama",
        description="Default LLM provider: 'ollama', 'claude', 'openai', or 'mock'"
    )
    OLLAMA_BASE_URL: str = Field(
        default="http://localhost:11434",
        description="Ollama daemon HTTP endpoint"
    )
    OLLAMA_MODEL: str = Field(
        default="llama3.2:3b",
        description="Default local model tag in Ollama"
    )
    ANTHROPIC_API_KEY: Optional[str] = Field(
        default=None,
        description="Optional Anthropic Claude API Key"
    )
    ANTHROPIC_MODEL: str = Field(
        default="claude-3-5-sonnet-20241022",
        description="Anthropic Claude model identifier"
    )
    OPENAI_API_KEY: Optional[str] = Field(
        default=None,
        description="Optional OpenAI API Key"
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4o",
        description="OpenAI model identifier"
    )

    # Retrieval & RAG Constraints
    SIMILARITY_THRESHOLD: float = Field(
        default=0.60,
        description="Minimum cosine similarity required to ground an answer (else refuse)"
    )
    TOP_K_RETRIEVAL: int = Field(
        default=3,
        description="Number of top chunks to retrieve per query"
    )
    EMBEDDING_DIM: int = Field(
        default=384,
        description="Vector dimensions (e.g. 384 for all-MiniLM-L6-v2)"
    )

    # Server & Logging
    LOG_LEVEL: str = Field(default="INFO", description="Log level")
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,*",
        description="Comma-separated allowed CORS origins"
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

def get_settings() -> Settings:
    return settings
