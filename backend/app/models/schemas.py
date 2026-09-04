"""
Pydantic v2 Data Validation Schemas for The Lenny Growth Assistant.
Defines clean request/response contracts for REST and Streaming APIs.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from datetime import datetime

class SessionCreate(BaseModel):
    title: Optional[str] = Field(default="New Conversation", description="Chat session title")

class ArtifactResponse(BaseModel):
    id: UUID
    message_id: UUID
    title: str
    artifact_type: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    artifacts: List[ArtifactResponse] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionDetailResponse(BaseModel):
    id: UUID
    title: str
    messages: List[MessageResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    session_id: UUID
    message: str = Field(..., min_length=1, description="User query or instruction")
    mode: Optional[str] = Field(default="default", description="'default' (Grounded QA) or 'ship30' (Ship 30 for 30 Essay)")
    provider: Optional[str] = Field(default=None, description="LLM provider: 'ollama', 'claude', 'openai', or 'mock'")

class HealthStatusResponse(BaseModel):
    status: str
    database: Dict[str, Any]
    pgvector: Dict[str, Any]
    llm_providers: Dict[str, Any]
    timestamp: datetime
