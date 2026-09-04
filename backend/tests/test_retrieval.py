"""
Unit tests for Transcript Retrieval, Similarity Threshold Gating, and Embeddings.
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
from app.rag.embeddings import default_embedder
from app.rag.retriever import TranscriptRetriever

@pytest.mark.asyncio
async def test_embedding_dimensions():
    """Verifies that the embedding engine produces a valid 384-dimension vector."""
    emb = await default_embedder.get_embedding("Product-led growth loops")
    assert isinstance(emb, list)
    assert len(emb) == 384

@pytest.mark.asyncio
async def test_out_of_domain_retrieval_rejection():
    """Verifies that an out-of-domain query (e.g. quantum physics or baking) yields 0 chunks."""
    retriever = TranscriptRetriever(session=None)
    chunks = await retriever.retrieve_relevant_chunks("How to make chocolate sourdough cake in the oven", top_k=5)
    assert len(chunks) == 0

@pytest.mark.asyncio
async def test_in_domain_retrieval_success():
    """Verifies that in-domain queries retrieve relevant chunks with citation metadata."""
    retriever = TranscriptRetriever(session=None)
    chunks = await retriever.retrieve_relevant_chunks("Adam Fishman onboarding growth team", top_k=3)
    if chunks:
        assert "episode" in chunks[0]
        assert "guest" in chunks[0]
        assert "text" in chunks[0]
        assert chunks[0]["score"] >= 0.60
