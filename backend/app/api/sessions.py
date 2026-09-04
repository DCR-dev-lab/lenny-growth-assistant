"""
Chat Sessions API Routes for The Lenny Growth Assistant.
Handles session creation, history retrieval, and session deletion.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
import logging

from app.database import get_db
from app.models.db_models import Session, Message, Artifact
from app.models.schemas import SessionCreate, SessionResponse, SessionDetailResponse, MessageResponse, ArtifactResponse

logger = logging.getLogger("api_sessions")
router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new independent chat session."""
    session = Session(title=payload.title or "New Conversation")
    db.add(session)
    await db.commit()
    await db.refresh(session)
    logger.info(f"Created new session: {session.id}")
    return session

@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    db: AsyncSession = Depends(get_db)
):
    """List all available chat sessions ordered by most recently updated."""
    query = select(Session).order_by(desc(Session.updated_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full message and artifact history for a specific session."""
    query = (
        select(Session)
        .where(Session.id == session_id)
        .options(
            selectinload(Session.messages).selectinload(Message.artifacts)
        )
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat session and cascade all related messages and artifacts."""
    query = select(Session).where(Session.id == session_id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()
    logger.info(f"Deleted session: {session_id}")
    return None
