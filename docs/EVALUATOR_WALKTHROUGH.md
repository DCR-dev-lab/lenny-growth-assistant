# Evaluator Verification Walkthrough & Runbook

This document provides evaluators with a 2-minute test matrix to verify all core functional requirements of the **Lenny Growth Assistant**:
1. Zero-hallucination grounded RAG with timestamped citations.
2. Out-of-domain refusal guardrails.
3. Structured Ship 30 format synthesis.
4. Interactive sandboxed HTML artifact generation.
5. Multi-provider resilience (Local Ollama vs. Cloud vs. Dynamic Fallback).

---

## Quick Setup Verification
Ensure all 4 Docker containers are up and running:
```bash
docker-compose ps
```
- Web Application: **`http://localhost:3000`**  
- Backend API Documentation: **`http://localhost:8000/docs`**

---

## 2-Minute Test Suite Matrix

### Test 1: Grounded RAG Query with Timestamped Citations
- **Objective:** Verify pgvector semantic retrieval and strict grounding against real podcast transcripts.
- **Action:** Query *"What does Adam Fishman say about onboarding?"* or click the prompt card **"Onboarding as a Growth Lever"**.
- **Expected Verification:**
  1. Response synthesizes specific insights (e.g., aligning marketing promise with product delivery).
  2. Grounded timestamp citation appears in the text: `[Adam Fishman, 00:00:00]`.
  3. Interactive source pills appear below the response with episode name, timestamp, and match similarity score.
  4. Clicking a source pill expands the verbatim transcript chunk.

---

### Test 2: Strict Out-of-Domain Guardrail (Refusal)
- **Objective:** Verify low-similarity queries are rejected without LLM hallucination.
- **Action:** Query *"How do I bake sourdough bread?"* or *"Who won the 2022 World Cup?"*.
- **Expected Verification:**
  1. Similarity score drops below retrieval threshold (`< 0.65`).
  2. The assistant refuses gracefully:
     > *"I do not have sufficient information in Lenny's podcast archive to answer this. My knowledge base is strictly grounded in episodes with Adam Fishman, Elena Verna, Shreyas Doshi, Brian Chesky, and other growth leaders. Please try a question on onboarding, product strategy, retention, growth teams, or pricing."*
  3. No citations or fabricated information are displayed.

---

### Test 3: Structured Ship 30 Essay Generation
- **Objective:** Verify multi-format output generation following the Ship 30 framework (Headline, 3-section breakdown, tactical takeaways).
- **Action:** Query *"Write a Ship 30 atomic essay on Elena Verna's product-led growth advice"*.
- **Expected Verification:**
  1. Structured essay format with bold headers and crisp bullet points.
  2. Every tactical principle is directly grounded in Elena Verna's transcript data.

---

### Test 4: Interactive Sandboxed Artifact Viewer
- **Objective:** Verify dynamic interactive HTML/JS widget rendering with security isolation.
- **Action:** Query *"Generate an interactive onboarding ROI calculator"* or click the prompt card **"Interactive Onboarding Calculator"**.
- **Expected Verification:**
  1. Assistant outputs an interactive component wrapped in an artifact block.
  2. The right-hand Artifact drawer opens automatically in split-screen mode.
  3. The calculator renders inside a sandboxed iframe (`sandbox="allow-scripts"` without `allow-same-origin`).
  4. Sliders or input fields dynamically calculate metrics in real time.

---

### Test 5: Dynamic Provider Routing & Resilience
- **Objective:** Verify the multi-model architecture.
- **Expected Verification:**
  1. Top-right badge shows current active provider (`Ollama (3.2)` when local daemon is active).
  2. If running in resource-constrained environments without GPU, the system automatically falls back to the dynamic fallback provider without crashing or timing out.
  3. FastEmbed (`BAAI/bge-small-en-v1.5`) generates 384-dimensional embeddings deterministically on CPU in <25ms.

---

## Automated Verification Suite
To execute the automated regression test suite directly:
```bash
python backend/tests/run_tests.py
```
**Expected Result:** `16 PASSED, 0 FAILED` covering vector search, RAG ingestion, refusal logic, artifact parsing, and provider routing.
