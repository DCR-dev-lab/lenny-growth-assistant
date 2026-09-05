# Complete Spoken Demo Video Script
## "The Lenny Growth Assistant" — Forward Deployed Engineer Take-Home
**Target Duration:** 2 minutes 30 seconds (2:15 – 2:45)  
**Camera:** Enabled (Webcam bubble in corner)  
**Screen:** Browser open at \http://localhost:3000\

---

## Pre-Recording Checklist (1 Minute Setup)
1. Ensure all Docker containers are running:
   \\\ash
   docker-compose up -d
   \\\
2. Open **[http://localhost:3000](http://localhost:3000)** in Chrome/Brave/Edge.
3. Start a fresh conversation by clicking **\+ New Conversation\**.
4. Set up your screen recording tool (Loom, OBS, or QuickTime) with your **camera bubble in the bottom-left corner**.

---

## Spoken Script & Screen Action Timeline

### [0:00 – 0:30] Introduction & Problem Framing
**Screen Action:** Camera focused on you or screen showing the clean homepage of The Lenny Growth Assistant (\http://localhost:3000\).

> **SAY (Spoken):**  
> *"Hi everyone, my name is [Your Name], and this is my submission for the Forward Deployed Engineer take-home assessment: **The Lenny Growth Assistant**.*  
>  
> *Growth leaders and product managers face critical execution decisions around onboarding, retention loops, and pricing. While Lenny’s Podcast has hundreds of hours of battle-tested insights from operators like Elena Verna, Shreyas Doshi, and Adam Fishman, accessing that wisdom is painful. Searching through hours of audio is impractical, and generic LLMs hallucinate unsourced advice.*  
>  
> *We built The Lenny Growth Assistant as an enterprise-grade, full-stack RAG application that delivers strictly grounded answers, Ship 30 for 30 essays, and Claude-style interactive artifacts—fully containerized with local Ollama."*

---

### [0:30 – 1:10] Local Ollama & Grounded QA with Citations
**Screen Action:** Point mouse to top-right Model Selector showing **\Ollama (3.2)\** with green pulsing live status dot. Click the first quick-prompt card: **"Onboarding as a Growth Lever"** (or type: *"What does Adam Fishman say about why onboarding is the most critical part of the product experience?"*) and hit Enter.

> **SAY (Spoken):**  
> *"First, notice our model selector in the header. We are running entirely on **local Ollama with Llama 3.2 3B**, containerized inside Docker with zero external API calls or data egress.*  
>  
> *Let's ask a strategic question: 'What does Adam Fishman say about why onboarding is the most critical part of the product experience?'*  
>  
> *The system vector-searches our PostgreSQL database with pgvector and HNSW indexing across 293 podcast chunks. Notice the streaming response: it directly cites **[Episode: Adam Fishman]** with the exact timestamp. Below the answer, we can expand the verified source cards to inspect the raw transcript excerpt and cosine similarity score."*

---

### [1:10 – 1:30] Guardrail & Out-of-Domain Refusal
**Screen Action:** Click the 4th quick prompt card or type: *"What is the best temperature and recipe for baking a sourdough bread loaf?"* and hit Enter.

> **SAY (Spoken):**  
> *"Enterprise RAG must know what it does not know. If I ask an out-of-domain question, like 'What is the best recipe for baking sourdough bread?', watch the strict refusal guardrail trigger immediately.*  
>  
> *The vector relevance gating identifies that similarity is below our 0.60 threshold, refusing to hallucinate and reminding the user that our knowledge base is strictly grounded in product and growth transcripts."*

---

### [1:30 – 2:05] Ship 30 for 30 & Claude-Style Interactive Artifact Canvas
**Screen Action:** Click the **\QA\** pill in the prompt bar (it switches to **\Ship 30\** in amber). Click the 3rd quick prompt card or type: *"Generate an interactive HTML/CSS viral growth loop calculator for modeling activation and K-factor."* and hit Enter.

> **SAY (Spoken):**  
> *"Now, let's switch modes to **Ship 30 for 30**. This uses a dedicated agent skill that transforms insights into high-retention executive writing—structured with a clear hook, 1-to-3 sentence paragraphs, bold anchors, and actionable takeaways.*  
>  
> *Notice that as the response streams, it automatically triggers our Claude-style **Artifact Canvas** beside the chat.*  
>  
> *Here, the assistant generated a live, interactive **Growth Loop Simulator**. I can drag the onboarding activation slider and viral coefficient slider to model compounding user growth in real-time.*  
>  
> *We have three tabs: **Preview**, dark-mode **Code View**, and our **Security Sandbox** tab.*  
>  
> *For security, all generated HTML is treated as untrusted. It is sanitized with DOMPurify and rendered in an iframe using \sandbox=\"allow-scripts\"\ while strictly omitting \llow-same-origin\. This assigns an opaque null origin, cryptographically preventing parent DOM access, cookie theft, or XSS."*

---

### [2:05 – 2:40] Architecture & Key Technical Trade-off
**Screen Action:** Briefly click the Model Selector dropdown (showing Ollama, Claude 3.5 Sonnet, GPT-4o, and Resilient Demo Mode), then toggle sidebar to show database health.

> **SAY (Spoken):**  
> *"To close, let's discuss our core **technical trade-off**: balancing local inference versus cloud frontier models.*  
>  
> *Local inference via Ollama guarantees total data privacy and zero marginal API cost, which enterprise compliance teams demand. However, running a 3-billion-parameter model on CPU introduces a tighter context window and inference latency. To solve this, we optimized our chunk retrieval budget to top-3 chunks and built a unified \BaseLLMProvider\ abstraction.*  
>  
> *With zero code changes, an operator can toggle between local Ollama, Claude 3.5 Sonnet, OpenAI GPT-4o, or our offline resilient demo fallback.*  
>  
> *The entire application—PostgreSQL with pgvector, Ollama, FastAPI backend, and Next.js frontend—boots in a single command with \docker-compose up\.*  
>  
> *Thank you for your time, and I look forward to discussing the architecture further!"*

---

## Quick Reference Summary Table for Candidate

| Timestamp | Screen Focus | Key Spoken Concept |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Homepage UI | Persona (Growth PMs), Problem (200+ hrs audio, hallucinations), Solution. |
| **0:30 - 1:10** | Chat & Sources | Local Ollama (\llama3.2:3b\), pgvector HNSW, streaming citations with timestamps. |
| **1:10 - 1:30** | Refusal Prompt | Out-of-domain refusal guardrail (sourdough query rejected). |
| **1:30 - 2:05** | Artifact Canvas | Ship 30 for 30 mode, interactive HTML calculator, \sandbox=\"allow-scripts\"\ isolation. |
| **2:05 - 2:40** | Model Selector | Trade-off: Local CPU inference & privacy vs. cloud reasoning; single-command Docker startup. |
