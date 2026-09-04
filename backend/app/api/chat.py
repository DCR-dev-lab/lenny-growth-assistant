"""
Chat API Route for The Lenny Growth Assistant.
Provides real-time Server-Sent Events (SSE) streaming with pgvector retrieval grounding,
Ship 30 for 30 essay generation, and Claude-style artifact extraction.
"""

import json
import logging
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.database import get_db, AsyncSessionLocal
from app.models.db_models import Session, Message, Artifact
from app.models.schemas import ChatRequest
from app.rag.retriever import TranscriptRetriever
from app.providers.factory import get_llm_provider
from app.skills.ship30_writer import build_ship30_prompt
from app.skills.artifact_generator import extract_artifacts
from app.config import get_settings

logger = logging.getLogger("api_chat")
settings = get_settings()
router = APIRouter(prefix="/api/chat", tags=["Chat"])

GROUNDED_QA_SYSTEM_PROMPT = """
You are the Lenny Growth Assistant—an authoritative, operational AI partner for Product Managers and Growth Leaders.
Your answers are strictly grounded in the provided transcripts from Lenny's Podcast archive.

### Guardrails & Instructions:
1. Strict Attribution: For every tactic, framework, or quote, you MUST cite the source using the exact format:
   [Episode: Guest Name, Timestamp: HH:MM:SS]
2. Honesty & Refusal: If the provided context does not contain enough information to answer authoritatively, explicitly state:
   "I do not have sufficient information in Lenny's podcast archive to answer this."
   Do NOT extrapolate or fabricate product management advice.
3. Tone: Direct, crisp, pragmatic, and high-agency.
4. Artifacts: When asked to build tools, calculators, templates, or HTML widgets, encapsulate the code inside:
   <artifact type="html" title="...">...complete self-contained HTML/CSS/JS...</artifact>
   or for comprehensive documents:
   <artifact type="markdown" title="...">...markdown...</artifact>

Context from Lenny's Podcast:
{context_data}
"""

@router.post("")
async def chat_stream(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Streams assistant response as Server-Sent Events (SSE).
    """
    # 1. Validate Session Exists
    session_query = select(Session).where(Session.id == payload.session_id)
    res = await db.execute(session_query)
    chat_session = res.scalar_one_or_none()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # 2. Persist User Message
    user_msg = Message(
        session_id=payload.session_id,
        role="user",
        content=payload.message,
        sources=[]
    )
    db.add(user_msg)
    
    # Auto-update session title if it is the first prompt
    if chat_session.title == "New Conversation":
        chat_session.title = payload.message[:45] + ("..." if len(payload.message) > 45 else "")
    chat_session.updated_at = datetime.utcnow()
    await db.commit()

    # 3. Load Recent History for Context
    history_query = (
        select(Message)
        .where(Message.session_id == payload.session_id)
        .order_by(Message.created_at)
    )
    hist_res = await db.execute(history_query)
    past_messages = [
        {"role": m.role, "content": m.content}
        for m in hist_res.scalars().all()
    ]

    # 4. Asynchronous Event Generator for SSE Stream
    async def event_generator():
        # Yield status event
        status_payload = json.dumps({"type": "status", "content": "Searching Lenny's Podcast archive..."})
        yield f"data: {status_payload}\n\n"

        retriever = TranscriptRetriever(session=db)
        chunks = await retriever.retrieve_relevant_chunks(payload.message)

        # Out-of-Domain Refusal Gate (with friendly greeting support)
        if not chunks:
            greetings = {"hi", "hello", "hey", "good morning", "good afternoon", "who are you", "what can you do", "help"}
            clean_msg = payload.message.lower().strip().strip("!.,?")
            if clean_msg in greetings or any(clean_msg.startswith(g) for g in ["hi ", "hello ", "hey "]):
                response_text = (
                    "Hello! I am **The Lenny Growth Assistant**—your operational AI partner for product management and growth strategy. "
                    "I am strictly grounded in *Lenny's Podcast* transcripts (featuring guests like Adam Fishman, Elena Verna, Shreyas Doshi, "
                    "Brian Chesky, and Gustaf Alströmer).\n\n"
                    "Here is what you can ask me to do:\n"
                    "- **Grounded Advice:** Ask about onboarding funnels, viral growth loops, or hiring growth teams.\n"
                    "- **Ship 30 for 30:** Switch to essay mode to generate structured, 1,250-word executive memos.\n"
                    "- **Interactive Artifacts:** Request live HTML calculators, widgets, or frameworks.\n\n"
                    "What growth or product challenge are you tackling today?"
                )
            else:
                response_text = (
                    "I do not have sufficient information in Lenny's podcast archive to answer this. "
                    "My knowledge base is strictly grounded in episodes with Adam Fishman, Elena Verna, "
                    "Shreyas Doshi, Brian Chesky, and other growth leaders. Please try a question on onboarding, "
                    "product strategy, retention, growth teams, or pricing."
                )

            # Yield tokens
            for word in response_text.split(" "):
                yield f"data: {json.dumps({'type': 'token', 'content': word + ' '})}\n\n"

            # Persist assistant message
            async with AsyncSessionLocal() as save_db:
                asst_msg = Message(
                    session_id=payload.session_id,
                    role="assistant",
                    content=response_text,
                    sources=[]
                )
                save_db.add(asst_msg)
                await save_db.commit()

            yield "data: [DONE]\n\n"
            return

        # Yield sources metadata to client
        sources_payload = [
            {
                "episode": c["episode"],
                "guest": c["guest"],
                "timestamp": c["timestamp"],
                "score": round(c["score"], 3),
                "snippet": c["text"][:180] + "..."
            }
            for c in chunks
        ]
        yield f"data: {json.dumps({'type': 'sources', 'content': sources_payload})}\n\n"

        # Build System Prompt based on mode
        if payload.mode == "ship30":
            system_prompt = build_ship30_prompt(payload.message, chunks)
        else:
            formatted_context = "\n\n".join([
                f"--- Episode: {c['episode']} (Guest: {c['guest']}, Timestamp: {c['timestamp']}) ---\n{c['text']}"
                for c in chunks
            ])
            system_prompt = GROUNDED_QA_SYSTEM_PROMPT.format(context_data=formatted_context)

        # Select LLM Provider
        provider = get_llm_provider(payload.provider)
        gen_status = json.dumps({"type": "status", "content": f"Generating response with {payload.provider or settings.DEFAULT_PROVIDER}..."})
        yield f"data: {gen_status}\n\n"

        accumulated_tokens = []
        try:
            async for token in provider.generate_response(past_messages, system_prompt):
                accumulated_tokens.append(token)
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            err_msg = f"\n[Generation Error: {str(e)}]"
            accumulated_tokens.append(err_msg)
            yield f"data: {json.dumps({'type': 'token', 'content': err_msg})}\n\n"

        full_content = "".join(accumulated_tokens)

        # Extract and persist artifacts
        artifacts = extract_artifacts(full_content)
        saved_artifacts = []

        async with AsyncSessionLocal() as save_db:
            asst_msg = Message(
                session_id=payload.session_id,
                role="assistant",
                content=full_content,
                sources=sources_payload
            )
            save_db.add(asst_msg)
            await save_db.flush()

            for art in artifacts:
                art_row = Artifact(
                    message_id=asst_msg.id,
                    title=art["title"],
                    artifact_type=art["type"],
                    content=art["content"]
                )
                save_db.add(art_row)
                await save_db.flush()
                saved_artifacts.append({
                    "id": str(art_row.id),
                    "title": art_row.title,
                    "type": art_row.artifact_type,
                    "content": art_row.content
                })

            await save_db.commit()

        # Emit artifact event to client if any artifacts were found
        for sa in saved_artifacts:
            yield f"data: {json.dumps({'type': 'artifact', 'content': sa})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
