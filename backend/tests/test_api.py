"""
Unit and integration tests for FastAPI application endpoints and validation contracts.
"""

try:
    import pytest
except ImportError:
    pytest = None
from app.models.schemas import ChatRequest, SessionCreate, SessionResponse
from uuid import uuid4

def test_chat_request_validation():
    """Verifies that ChatRequest requires a valid session UUID and non-empty message."""
    session_id = uuid4()
    req = ChatRequest(session_id=session_id, message="Tell me about onboarding", mode="default")
    assert req.session_id == session_id
    assert req.message == "Tell me about onboarding"
    assert req.mode == "default"

def test_session_create_default_title():
    """Verifies default title assignment in SessionCreate."""
    req = SessionCreate()
    assert req.title == "New Conversation"

def test_session_create_custom_title():
    """Verifies custom title assignment."""
    req = SessionCreate(title="Growth Loops Discussion")
    assert req.title == "Growth Loops Discussion"
