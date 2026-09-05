# The Lenny Growth Assistant 🎙️🚀

> An enterprise-grade, retrieval-augmented generation (RAG) conversational web application that unlocks operational product management and growth wisdom from *Lenny’s Podcast* transcripts.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%20(JavaScript)-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Vector%20DB-PostgreSQL%20%2B%20pgvector-336791?style=flat&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Ollama](https://img.shields.io/badge/Local%20LLM-Ollama-purple?style=flat)](https://ollama.com/)
[![Tests](https://img.shields.io/badge/Tests-16%20Passed%2C%200%20Failed-emerald?style=flat)]()

---

## 1. Executive Summary & Forward Deployment Overview

Product leaders and growth managers face critical, high-stakes decisions (onboarding funnels, pricing tiers, retention loops, team topology). While *Lenny's Podcast* contains hundreds of hours of tactical advice from world-class operators (Elena Verna, Shreyas Doshi, Adam Fishman, Brian Chesky), accessing this knowledge is difficult. Traditional LLMs hallucinate generic advice without verifiable attribution.

**The Lenny Growth Assistant** delivers:
1. **Source-Attributed Grounding:** Verifiable citations formatted as `[Episode: Guest Name, Timestamp: HH:MM:SS]` strictly retrieved from podcast transcripts, refusing out-of-domain queries when evidence is insufficient.
2. **Ship 30 for 30 Content Engine:** Transforms answers into a ~1,250-word, high-retention essay adhering to the structured formatting heuristics of the *Ship 30 for 30* writing framework.
3. **Claude-Style Side-by-Side Artifact Viewer:** Securely renders generated Markdown documents or interactive HTML/CSS/JS widgets in a sandboxed `<iframe>`.
4. **Dual Model Layer (Local & Cloud):** Instant runtime switching between local Ollama (`llama3.2:3b`, `llama3.1:8b`), Anthropic Claude (`claude-3-5-sonnet`), OpenAI (`gpt-4o`), and a resilient offline demo fallback.
5. **Single-Command Operability:** Fully deployable via `docker-compose up` backed by PostgreSQL 16, `pgvector` HNSW indexing, and complete Forward Deployment documentation.

---

## 2. Architecture & Data Flow

```
                  ┌────────────────────────────────────────────────────────┐
                  │             Next.js Frontend (JavaScript)              │
                  │  ┌─────────────────────────┬─────────────────────────┐ │
                  │  │   Chat & Stream Pane    │  Claude-Style Artifact  │ │
                  │  │ (Session, History, Cit.)│  (Sandboxed Iframe/MD)  │ │
                  │  └────────────┬────────────┴────────────▲────────────┘ │
                  └───────────────┼─────────────────────────┼──────────────┘
                                  │ SSE Stream              │
                                  ▼                         │
                  ┌─────────────────────────────────────────┴──────────────┐
                  │                 FastAPI Backend Service                │
                  │  ┌──────────────────────────────────────────────────┐  │
                  │  │  Agent Routing & Orchestration Layer             │  │
                  │  │  - Mode: Grounded QA vs. Ship 30 for 30 Essay    │  │
                  │  │  - Artifact Extraction & Generation Pipeline     │  │
                  │  └──────────────┬───────────────────┬───────────────┘  │
                  │                 │                   │                  │
                  │                 ▼                   ▼                  │
                  │     ┌───────────────────┐   ┌───────────────────────┐  │
                  │     │   RAG Retriever   │   │  LLM Provider Router  │  │
                  │     │ (pgvector + HNSW) │   │ (Ollama / Cloud / Sim)│  │
                  │     └─────────┬─────────┘   └───────────┬───────────┘  │
                  └───────────────┼─────────────────────────┼──────────────┘
                                  ▼                         ▼
                         PostgreSQL 16 + pgvector     Local Ollama / Cloud
```

---

## 3. Quick Start (Single Command)

### Option A: Complete Docker Compose Deployment (Recommended)

1. **Clone the repository and copy the environment template:**
   ```bash
   cp .env.example .env
   ```
2. **Start all services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```
3. **Open the web application:**
   - Frontend UI: `http://localhost:3000`
   - Backend API Docs (Swagger): `http://localhost:8000/docs`
   - Health Diagnostic Probe: `http://localhost:8000/api/health`

---

### Option B: Local Native Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install   # (or npm.cmd install on Windows)
npm run dev
```

---

## 4. Knowledge Ingestion & Vector Indexing

The project comes pre-bundled with a curated starter pack of 8 real episode transcripts in `data/transcripts/` (Adam Fishman, Elena Verna, Shreyas Doshi, Brian Chesky, Gustaf Alströmer, Casey Winters, Bob Moesta, Gibson Biddle).

To ingest and index into PostgreSQL with pgvector:
```bash
python backend/scripts/ingest.py
```
To fetch more episodes directly from the public GitHub archive:
```bash
python backend/scripts/download_transcripts.py --episodes adam-fishman elena-verna shreyas-doshi
```

---

## 5. Multi-Provider LLM & Dynamic Routing

The application supports zero-code model switching directly from the UI header badge:
- **Local Ollama (Mandatory for Evaluation Demo):** Connects to `http://localhost:11434` running `llama3.2:3b` or `llama3.1:8b`.
- **Anthropic Claude:** Set `ANTHROPIC_API_KEY` in `.env` to enable `claude-3-5-sonnet-20241022`.
- **OpenAI:** Set `OPENAI_API_KEY` in `.env` to enable `gpt-4o`.
- **Resilient Demo Mode:** Automatic fallback provider that streams grounded responses, Ship 30 for 30 essays, and interactive HTML artifacts even when Ollama is offline or API keys are missing.

---

## 6. Security Architecture & Artifact Isolation

Dynamic HTML/CSS artifacts generated by LLMs execute inside a strict security sandbox:
- **Sanitization:** HTML is sanitized with `DOMPurify` prior to injection.
- **Iframe Sandboxing:** Rendered with `sandbox="allow-scripts"` (strictly **omitting** `allow-same-origin`).
- **Isolation Guarantee:** The iframe runs in an opaque `null` origin. It cannot read parent cookies, access `localStorage` / `sessionStorage`, or interact with the parent window DOM.

---

## 7. Automated & Manual Testing

### Automated Test Suite
Run the comprehensive test suite covering skills, retrieval gating, provider routing, and API schemas:
```bash
python backend/tests/run_tests.py
# Or with pytest:
pytest backend/tests -v
```
**Results:** `16 PASSED, 0 FAILED`.

### Manual UI Test Plan
1. **Grounded Query:** Ask *"What does Adam Fishman say about onboarding?"* -> Confirm citation `[Episode: Adam Fishman, Timestamp: 00:00:00]`.
2. **Out-of-Domain Guardrail:** Ask *"How do I bake sourdough bread?"* -> Confirm strict refusal response.
3. **Ship 30 for 30 Mode:** Switch mode to Ship 30 for 30 and prompt *"High-agency product management"* -> Verify ~1,250-word structured output with hook and bold bullet anchors.
4. **Interactive Artifact Viewer:** Ask *"Generate an interactive HTML growth loop calculator"* -> Verify the right-hand Artifact drawer opens and sliders calculate metrics inside the sandboxed iframe.

---

## 8. Forward Deployment Deliverables Index

| # | Deliverable | Location | Description |
| :--- | :--- | :--- | :--- |
| 1 | **Source Code** | `/backend`, `/frontend` | Complete full-stack implementation with clean separation of concerns. |
| 2 | **PRD** | [`docs/PRD.md`](docs/PRD.md) | Persona, JTBD, measurable metrics, scope choices, risks, and implementation plan. |
| 3 | **Architecture Spec** | [`docs/architecture.md`](docs/architecture.md) | Database schemas, HNSW pgvector indexing, contracts, and security topology. |
| 4 | **Design Spec** | [`docs/design.md`](docs/design.md) | UI/UX principles, interaction states, responsive behavior, and accessibility. |
| 5 | **Agent Transcripts** | [`agent_transcripts/`](agent_transcripts/) | Engineering logs, debugging pgvector indexing, and environment resilience. |
| 6 | **Demo Video Script** | [`docs/DEMO_VIDEO_SCRIPT.md`](docs/DEMO_VIDEO_SCRIPT.md) | 2–3 minute video outline and timestamped script for candidate submission. |
| 7 | **Tests** | [`backend/tests/`](backend/tests/) | 16 automated test suites + manual UI test plan. |

---

## 9. Troubleshooting & Operational Runbook

### 1. Ollama Model Pull & Readiness
If local Ollama reports `model 'llama3.2:3b' not found`:
```bash
# Pull model directly inside the running container:
docker exec -it lenny_ollama ollama pull llama3.2:3b

# Or verify pulled models:
docker exec -it lenny_ollama ollama list
```

### 2. Port Collision Resolution
If ports `5432`, `8000`, `3000`, or `11434` are already bound on your host:
- In `docker-compose.yml`, remap the host port (e.g. `"5433:5432"` or `"8001:8000"`).
- Update `NEXT_PUBLIC_API_URL` accordingly in `.env`.

### 3. Re-indexing Pgvector Knowledge Base
To wipe and re-index the 8 starter episodes:
```bash
docker exec -it lenny_backend python scripts/ingest.py
```

### 4. Health Check Diagnostics
Visit `http://localhost:8000/api/health` in your browser. A healthy payload returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "pgvector": "293 chunks indexed",
  "llm_provider": {
    "provider": "ollama",
    "available": true,
    "model": "llama3.2:3b"
  }
}
```

### 5. Extending the System (New Episodes & Skills)
- **Adding Episodes:** Place new `.txt` or `.md` transcript files into `data/transcripts/` and re-run `python scripts/ingest.py`.
- **Adding Agent Skills:** Register a new skill module in `backend/app/skills/` and expose it via the router in `backend/app/api/chat.py`.
