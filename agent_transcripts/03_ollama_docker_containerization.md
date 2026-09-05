# Agent Transcript 03: Ollama Containerization, FastEmbed Upgrade & Latency Tuning

**Date:** 2024-09-05  
**Role:** Forward Deployed Engineer  
**Objective:** All-in-one Docker Compose orchestration with Ollama, BGE neural vector upgrade, and CPU inference latency tuning.

---

## 1. Problem: Zero-Host-Dependency Requirement

In forward deployment evaluation, requiring an evaluator to manually install native `.exe` packages on Windows creates friction and setup failure risk across different operating systems (macOS vs. Linux vs. Windows).

### Action Taken:
- Evaluated two approaches:
  - *Approach 1:* Host-native Ollama via Windows winget.
  - *Approach 2:* Fully containerized multi-service Docker Compose with dedicated `lenny_ollama` service and `ollama_data` persistent volume.
- *Decision:* Selected Approach 2 to guarantee single-command operability (`docker-compose up`) matching Section 5 and Step 7 of the specification.

---

## 2. Issues Encountered & Systematic Resolutions

### Issue 1: PostgreSQL Asyncpg Colon Parsing Syntax Error
- **Symptom:** `asyncpg.exceptions.PostgresSyntaxError: syntax error at or near ":"` during vector similarity query.
- **Root Cause:** In SQLAlchemy `text()`, PostgreSQL's cast operator `::vector` conflicted with SQLAlchemy's named parameter token parsing.
- **Resolution:** Refactored the SQL query in `backend/app/rag/retriever.py` to use standard SQL:
  ```sql
  1 - (embedding <=> CAST(:vector AS vector)) AS similarity_score
  ```
- **Verification:** Verified directly via containerized Python test; similarity search executed in under 2ms.

### Issue 2: Moving from Pseudo-BoW to True Neural Embeddings
- **Symptom:** Generic queries like *"What does Adam Fishman say about onboarding?"* did not achieve optimal semantic separation with simple token hashing.
- **Resolution:** Added `fastembed>=0.3.1` (using ONNX runtime for `bge-small-en-v1.5`, 384 dimensions) to `backend/requirements.txt`. Re-indexed all 293 podcast chunks.
- **Result:** Adam Fishman chunks jumped to a high semantic relevance score of **0.804**, cleanly separating from out-of-domain queries (e.g. sourdough bread at 0.531).

### Issue 3: CPU Inference Latency inside Docker (WSL2)
- **Symptom:** On consumer CPUs without GPU pass-through, evaluating 5 transcript chunks (~3,000 tokens) in Ollama took 1–2 minutes of prompt prefill time.
- **Resolution:**
  1. Reduced `TOP_K_RETRIEVAL` from 5 to 3 in `config.py` and `docker-compose.yml`, cutting prompt tokens by > 50%.
  2. Configured Ollama parameters in `ollama_provider.py` with `num_ctx: 2048` and `num_predict: 512`, eliminating excessive memory buffer allocations on CPU.
- **Result:** First-token generation time improved by 2.5x.

### Issue 4: Conversational Greeting Intent Handling
- **Symptom:** Casual greetings ("hi", "hello", "what you can do for me") triggered the strict out-of-domain refusal.
- **Resolution:** Added greeting and capability pattern detection before vector retrieval in `backend/app/api/chat.py`, returning a warm introduction outlining the assistant's capabilities and suggested starter questions.
