# System Architecture Specification
## Project: The Lenny Growth Assistant

**Status:** Approved  
**Author:** Forward Deployed Engineering  

---

## 1. System Overview & Component Topology

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|  Next.js (App Router, JavaScript, Tailwind CSS, Lucide, DOMPurify)                |
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  |             Chat Pane               |  |     Side-by-Side Artifact Viewer   |  |
|  | - Session Management & History      |  | - Sandboxed iframe (allow-scripts) |  |
|  | - Dual Mode Toggle (QA vs. Ship 30) |  | - DOMPurify HTML Sanitization      |  |
|  | - Dynamic Model Badge & Toggle      |  | - React Markdown + Syntax Highlgt  |  |
|  | - Real-time SSE Token Streaming     |  | - Copy to Clipboard / Fullscreen   |  |
|  +------------------+------------------+  +-----------------+------------------+  |
+---------------------|---------------------------------------|---------------------+
                      | HTTP REST / SSE (EventStream)         |
                      v                                       |
+-------------------------------------------------------------|---------------------+
|                              BACKEND SERVICE (FastAPI)      |                     |
|                                                             |                     |
|  +----------------------------------------------------+     |                     |
|  | API Routing Layer                                  |     |                     |
|  | - /api/sessions: Session Lifecycle & Persistence   |     |                     |
|  | - /api/chat: SSE Stream Router & State Machine     |     |                     |
|  | - /api/health: Relational, Vector & Model Probes   |     |                     |
|  +--------------------------+-------------------------+     |                     |
|                             |                               |                     |
|  +--------------------------v-------------------------+     |                     |
|  | Agent & Skill Orchestrator                         |     |                     |
|  | - Grounded QA Engine (Strict Attribution & Refusal)|     |                     |
|  | - Ship 30 for 30 Essay Skill (1,250 words, Heurist)|     |                     |
|  | - Artifact Tag Parser (<artifact type=...>) -------+-----+                     |
|  +-------------+--------------------------+-----------+                           |
|                |                          |                                       |
|                v                          v                                       |
|  +-------------------------+  +------------------------------------+              |
|  | RAG Retrieval Engine    |  | Dynamic LLM Provider Layer         |              |
|  | - fastembed / all-MiniLM|  | - BaseLLMProvider (Abstract)       |              |
|  | - Query Embedder (384d) |  | - OllamaProvider (Local 3B/8B)     |              |
|  | - Cosine Distance (<=>) |  | - ClaudeProvider (Anthropic SDK)   |              |
|  | - Out-of-Domain Gate    |  | - OpenAIProvider (GPT-4o)          |              |
|  +-------------+-----------+  | - Resilient Demo Mock Fallback     |              |
|                |              +-----------------+------------------+              |
+----------------|--------------------------------|---------------------------------+
                 v                                v
+--------------------------------+  +-----------------------------------------------+
|       DATA & VECTOR STORE      |  |             LLM EXECUTION ENGINES             |
| PostgreSQL 16 + pgvector       |  |                                               |
| - sessions                     |  | [Local] Ollama Daemon (http://localhost:11434)|
| - messages (JSONB sources)     |  |         Models: llama3.2:3b, llama3.1:8b      |
| - artifacts                    |  |                                               |
| - transcript_chunks            |  | [Cloud] Anthropic API (Claude 3.5 Sonnet)     |
|   (HNSW Index on embedding)    |  | [Cloud] OpenAI API (GPT-4o)                   |
+--------------------------------+  +-----------------------------------------------+
```

---

## 2. Database Schema (`PostgreSQL + pgvector`)

The persistence layer uses PostgreSQL 16 with the official `pgvector` extension.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Chat Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_session_id ON messages(session_id);

-- 3. Artifacts (Generated Markdown / HTML)
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artifact_type VARCHAR(32) NOT NULL CHECK (artifact_type IN ('markdown', 'html')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_artifacts_message_id ON artifacts(message_id);

-- 4. Podcast Transcript Chunks & Vector Embeddings
CREATE TABLE transcript_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_title VARCHAR(255) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    publish_date VARCHAR(64),
    timestamp_ref VARCHAR(32),
    chunk_text TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL
);

-- Approximate Nearest Neighbor Index (HNSW for Sub-Millisecond Cosine Similarity)
CREATE INDEX idx_chunks_embedding_hnsw 
ON transcript_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## 3. Ingestion & Retrieval Flow

### 3.1 Ingestion Pipeline
1. **Source Transcripts:** Transcripts are pulled via `backend/scripts/download_transcripts.py` from the open source archive `ChatPRD/lennys-podcast-transcripts`.
2. **Metadata Extraction:** YAML frontmatter (guest name, episode title, publish date, keywords) and speaker timestamps (`Adam Fishman (00:00:00)`) are parsed.
3. **Recursive Chunking:** Text is broken down into chunks of $500\text{--}800$ tokens with a $100$-token sliding overlap, ensuring sentences and speaker turns are not cleaved arbitrarily.
4. **Vector Embedding:** Embeddings are produced using `all-MiniLM-L6-v2` (384 dimensions) locally.
5. **Upsert:** Chunks and vector weights are committed to `transcript_chunks` with HNSW indexing.

### 3.2 Retrieval & Grounding Strategy
1. **Query Embedding:** Incoming user prompt is embedded into a 384-dimensional dense vector $\vec{q}$.
2. **Vector Similarity Query:**
   ```sql
   SELECT
       episode_title,
       guest_name,
       timestamp_ref,
       chunk_text,
       1 - (embedding <=> :query_vector::vector) AS similarity_score
   FROM transcript_chunks
   WHERE 1 - (embedding <=> :query_vector::vector) >= :threshold
   ORDER BY similarity_score DESC
   LIMIT :top_k;
   ```
3. **Relevance Gating:** If the maximum similarity score among retrieved chunks is $< 0.60$, the system bypasses generation and strictly responds:
   > *"I do not have sufficient information in Lenny's podcast archive to answer this."*
4. **Citation Enforcement:** Prompt constraints require citations matching `[Episode: Guest Name, Timestamp: HH:MM:SS]`.

---

## 4. Multi-Provider LLM Abstraction Layer

To ensure zero code changes when toggling between models, all LLM drivers implement a standard asynchronous interface:

```python
class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        pass
```

### Supported Drivers:
- **`OllamaProvider`:** Connects to `http://localhost:11434/api/chat` using streaming JSON NDJSON parser. Model default: `llama3.2:3b` or `llama3.1:8b`.
- **`ClaudeProvider`:** Connects to Anthropic API (`claude-3-5-sonnet-20241022`) via async HTTP client with streaming SSE.
- **`OpenAIProvider`:** Connects to OpenAI API (`gpt-4o`).
- **`ResilientMockProvider`:** Built-in offline fallback driver that generates high-fidelity grounded responses when external daemons are offline, guaranteeing reliable testing and evaluation.

---

## 5. Security & Isolation Specification

### Untrusted Content Threat Model
Generated HTML/CSS code produced by LLMs may contain malicious payloads, unauthorized storage scraping (`localStorage`, `sessionStorage`, `document.cookie`), or attempts to access parent window scopes.

### Defense-in-Depth Isolation Strategy:
1. **Content Sanitization:** Prior to injecting into the iframe, the HTML string is processed through `DOMPurify` to eliminate dangerous tags while permitting legitimate markup, CSS, and inline scripts.
2. **Sandbox Flag Configuration:**
   ```html
   <iframe
     title={title}
     srcDoc={sanitizedHtml}
     sandbox="allow-scripts"
     className="w-full h-full border-0"
   />
   ```
   > [!IMPORTANT]
   > The sandbox strictly **omits** `allow-same-origin`. This renders the iframe in a unique, opaque origin (`null`), making it cryptographically impossible for scripts inside the iframe to:
   > - Access parent `document` or `window` objects.
   > - Read or write parent cookies.
   > - Access browser `localStorage` or `sessionStorage`.
   > - Make authenticated same-origin API requests on behalf of the user.

---

## 6. API Contracts & Endpoints

| Method | Endpoint | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sessions` | Creates a new chat session | Body: `{ "title": "Optional" }` -> Returns `SessionResponse` |
| `GET` | `/api/sessions` | Lists all chat sessions | Returns `List[SessionResponse]` |
| `GET` | `/api/sessions/{id}` | Retrieves session message history | Returns `SessionDetailResponse` |
| `POST` | `/api/chat` | Streams agent completion via SSE | Body: `ChatRequest` -> SSE Stream |
| `GET` | `/api/health` | Diagnostic status of DB, pgvector, LLMs | Returns `HealthStatusResponse` |

### SSE Event Format:
- `data: {"type": "status", "content": "Searching transcripts..."}`
- `data: {"type": "sources", "content": [...]}`
- `data: {"type": "token", "content": "word"}`
- `data: {"type": "artifact", "content": {"title": "...", "type": "html", "code": "..."}}`
- `data: [DONE]`
