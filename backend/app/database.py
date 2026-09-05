"""
Database Connection and Session Factory for The Lenny Growth Assistant.
Uses SQLAlchemy 2.0 Async engine with asyncpg and pgvector support.
"""

import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.config import get_settings

logger = logging.getLogger("database")
settings = get_settings()

try:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_size=10,
        max_overflow=20
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )
except Exception as e:
    logger.warning(f"Async database engine initialization deferred: {e}")
    engine = None
    AsyncSessionLocal = None

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initializes the database, creating pgvector extension and tables."""
    try:
        async with engine.begin() as conn:
            # Enable vector extension
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
            
            # Create all registered tables
            from app.models.db_models import Session, Message, Artifact, TranscriptChunk
            await conn.run_sync(Base.metadata.create_all)
            
            # Create HNSW index on transcript_chunks if table exists
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
                ON transcript_chunks 
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64);
            """))
            logger.info("Database schema, pgvector extension, and HNSW index initialized successfully.")

            # Auto-seed starter transcripts if running on a fresh empty database
            chunk_check = await conn.execute(text("SELECT COUNT(*) FROM transcript_chunks;"))
            chunk_count = chunk_check.scalar() or 0
            if chunk_count == 0:
                logger.info("Fresh database detected (0 transcript chunks). Initiating background starter ingestion...")
                import asyncio
                try:
                    from scripts.ingest import ingest_transcripts
                    asyncio.create_task(ingest_transcripts())
                except Exception as seed_err:
                    logger.warning(f"Could not auto-trigger ingestion on startup: {seed_err}")
    except Exception as e:
        logger.warning(f"Database initialization notice (DB might be connecting or migrating): {e}")
