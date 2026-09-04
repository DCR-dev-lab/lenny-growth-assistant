"""
SQLAlchemy ORM Models for The Lenny Growth Assistant.
Includes Chat Sessions, Messages, Artifacts, and Pgvector Transcript Chunks.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base
from app.config import get_settings

settings = get_settings()

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")

    def __repr__(self):
        return f"<Session {self.id}: {self.title}>"

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    sources = Column(JSONB, default=list, nullable=False)  # Retrieved chunks used for grounding
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")
    artifacts = relationship("Artifact", back_populates="message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Message {self.id} [{self.role}]>"

class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    artifact_type = Column(String(32), nullable=False)  # 'markdown' or 'html'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    message = relationship("Message", back_populates="artifacts")

    def __repr__(self):
        return f"<Artifact {self.id} [{self.artifact_type}]: {self.title}>"

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_title = Column(String(255), nullable=False, index=True)
    guest_name = Column(String(255), nullable=False, index=True)
    publish_date = Column(String(64), nullable=True)
    timestamp_ref = Column(String(32), nullable=True)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=False)

    def __repr__(self):
        return f"<TranscriptChunk {self.guest_name} @ {self.timestamp_ref}>"
