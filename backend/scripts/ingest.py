"""
Transcript Ingestion Pipeline for The Lenny Growth Assistant.
Parses Markdown episode transcripts, chunks them recursively (500-800 tokens, 100 overlap),
generates dense vector embeddings, and inserts them into PostgreSQL with pgvector HNSW indexing.
"""

import os
import sys
import glob
import asyncio
import logging
from typing import List

# Add parent directory to path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from app.config import get_settings
from app.rag.chunker import chunk_transcript
from app.rag.embeddings import default_embedder
from app.models.db_models import TranscriptChunk, Base

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest")
settings = get_settings()

async def ingest_transcripts(transcripts_dir: str = "data/transcripts", batch_size: int = 25):
    """Parses, embeds, and inserts all transcript files in the specified directory."""
    files = glob.glob(os.path.join(transcripts_dir, "*.md"))
    if not files:
        logger.warning(f"No .md transcript files found in '{transcripts_dir}'. Run download_transcripts.py first.")
        return

    logger.info(f"Discovered {len(files)} transcript files in '{transcripts_dir}'. Starting chunking & embedding...")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    # Ensure schema and extensions are ready
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        await conn.run_sync(Base.metadata.create_all)

    total_chunks_inserted = 0

    for file_idx, fpath in enumerate(files, 1):
        filename = os.path.basename(fpath)
        logger.info(f"[{file_idx}/{len(files)}] Processing '{filename}'...")
        
        chunks = chunk_transcript(fpath, target_tokens=600, overlap_tokens=100)
        logger.info(f"  Generated {len(chunks)} windowed chunks for '{filename}'. Embedding...")

        async with session_factory() as session:
            # Check if this episode was already ingested
            if chunks:
                ep_title = chunks[0]["episode_title"]
                check_res = await session.execute(
                    text("SELECT COUNT(*) FROM transcript_chunks WHERE episode_title = :title"),
                    {"title": ep_title}
                )
                existing = check_res.scalar() or 0
                if existing > 0:
                    logger.info(f"  Episode '{ep_title}' already has {existing} chunks in DB. Skipping duplicate.")
                    continue

            # Process in batches
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]
                texts_to_embed = [c["chunk_text"] for c in batch]
                embeddings = await default_embedder.get_embeddings(texts_to_embed)

                db_objects = []
                for chunk_data, emb in zip(batch, embeddings):
                    chunk_obj = TranscriptChunk(
                        episode_title=chunk_data["episode_title"],
                        guest_name=chunk_data["guest_name"],
                        publish_date=chunk_data["publish_date"],
                        timestamp_ref=chunk_data["timestamp_ref"],
                        chunk_text=chunk_data["chunk_text"],
                        embedding=emb
                    )
                    db_objects.append(chunk_obj)

                session.add_all(db_objects)
                await session.commit()
                total_chunks_inserted += len(db_objects)

        logger.info(f"  Completed '{filename}'. Cumulative chunks stored: {total_chunks_inserted}")

    # Build / refresh HNSW index
    async with engine.begin() as conn:
        logger.info("Optimizing HNSW cosine distance index...")
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
            ON transcript_chunks 
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        """))

    await engine.dispose()
    logger.info(f"Ingestion complete! Successfully indexed {total_chunks_inserted} transcript chunks.")

if __name__ == "__main__":
    transcripts_path = sys.argv[1] if len(sys.argv) > 1 else "data/transcripts"
    asyncio.run(ingest_transcripts(transcripts_path))
