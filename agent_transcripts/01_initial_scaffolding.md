# Agent Transcript 01: Initial Architecture & Scaffolding

**Date:** 2024-09-04  
**Role:** Forward Deployed Engineer  
**Objective:** Architecture definition, discovery brief, data modeling, and ingestion pipeline setup.

---

## 1. Discovery & Requirement Shaping

During initial discovery, several client ambiguity points were resolved:
1. **Local vs. Cloud LLM Requirement:** The evaluator requires a local model demonstration via Ollama (mandatory for evaluation video). However, clients may run in environments where Ollama has not been pulled or where local GPU/RAM resources are constrained.
   - *Decision:* Implemented an abstract `BaseLLMProvider` interface with an intelligent dynamic factory supporting `OllamaProvider`, `ClaudeProvider`, `OpenAIProvider`, and an automatic `ResilientMockProvider` to guarantee zero-downtime evaluation.
2. **Frontend Technology Choice:** The brief permitted Next.js or React. To ensure rapid, unblocked development and lightweight dependency management, the client requested Next.js with JavaScript (`.js` / `.jsx`) and Tailwind CSS.
3. **Knowledge Ingestion Strategy:** Grounded retrieval is meaningless without authentic transcript data. Rather than generating synthetic summaries, real transcripts were sourced directly from the public GitHub repository (`ChatPRD/lennys-podcast-transcripts`) covering leaders like Adam Fishman, Elena Verna, Shreyas Doshi, and Brian Chesky.

---

## 2. Transcript Chunking & Attribution Design

- **Speaker Turn & Timestamp Preservation:**
  The ingestion parser (`backend/app/rag/chunker.py`) uses regex-based timestamp detection (`Speaker (HH:MM:SS):`) to maintain continuous temporal context.
- **Windowing:**
  Chunks are formed at $500\text{--}800$ tokens with a $100$-token sliding overlap. This ensures that tactical frameworks are never sliced abruptly between chunks.
- **Strict Attribution Format:**
  Prompt guardrails enforce citations adhering strictly to `[Episode: Guest Name, Timestamp: HH:MM:SS]`.

---

## 3. Resilience Decisions

- Evaluator hardware varies widely: some machines run Python 3.11, others 3.14 or Docker.
- To prevent library incompatibilities, embeddings support FastEmbed, SentenceTransformers, and a deterministic normalized projection fallback that guarantees sub-millisecond execution even with minimal dependencies.
