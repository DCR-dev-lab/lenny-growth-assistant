# Evaluator Demo Video Script & Runbook
## The Lenny Growth Assistant (2–3 Minutes)

**Requirement:** 2–3 minute screen recording with camera/webcam enabled explaining the problem, demonstrating the product, showing local Ollama, and explaining one key technical trade-off.

---

## 1. Video Outline & Timestamp Guide

| Time | Section | On-Screen Action | Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:30** | **Introduction & Problem Framing** | Camera on face, then switch to split screen showing Lenny Growth Assistant UI. | - Introduce yourself as a Forward Deployed Engineer.<br>- Frame the core customer problem: *"Growth PMs and product leaders need battle-tested tactics from Lenny's Podcast, but listening to 200+ hours of audio or scanning transcripts is impractical. Generic LLMs hallucinate unsourced advice. We built The Lenny Growth Assistant to deliver strictly grounded, cited operational intelligence, Ship 30 for 30 essays, and interactive Claude-style artifacts."* |
| **0:30 - 1:15** | **Grounded RAG & Local Ollama Demo** | Show the Model Selector badge on the top right (`Ollama: llama3.2:3b`). Submit query: *"What does Adam Fishman say about onboarding?"* | - Point out the model indicator running local Ollama.<br>- Observe the status updates: *"Searching Lenny's Podcast archive..."*<br>- Show the streaming response citing `[Episode: Adam Fishman, Timestamp: 00:00:00]`.<br>- Click the citation accordion to reveal the exact transcript snippet and cosine similarity score.<br>- **Guardrail check:** Submit *"How do I bake sourdough bread?"* and show the assistant strictly refusing to answer out-of-domain queries. |
| **1:15 - 1:55** | **Ship 30 for 30 & Claude Artifact Viewer** | Toggle the mode pill to **Ship 30 for 30**. Prompt: *"Generate an interactive viral growth loop calculator for modeling activation and K-factor."* | - Explain the Ship 30 for 30 engine: adheres to high-retention heuristics (~1,250 words, counterintuitive hook, 1-3 sentence paragraphs, bold anchors, actionable checklist).<br>- Watch the right-hand **Claude-style Artifact Viewer** open automatically.<br>- Demonstrate the live, interactive calculator: drag the activation rate and K-factor sliders to show calculations running inside the preview.<br>- Highlight the **Code** tab showing the raw HTML/CSS/JS.<br>- Explain the security sandbox: `sandbox="allow-scripts"` with `allow-same-origin` omitted to eliminate XSS or session scraping vulnerabilities. |
| **1:55 - 2:30** | **Architecture & Key Technical Trade-off** | Briefly show `architecture.md` or Docker Compose terminal. | - **Technical Trade-off:** Explain the choice between running local 3B/8B models vs. cloud APIs:<br>  *Local models via Ollama give complete data privacy and zero marginal API cost, but 3B models have tighter reasoning windows and higher first-token latency on CPU. Cloud models offer faster reasoning but incur latency variance and ongoing cost.*<br>- Show our dynamic abstraction layer (`BaseLLMProvider`) that enables zero-code toggling between Ollama, Anthropic Claude, OpenAI, and a resilient demo fallback.<br>- Conclude with single-command operability: `docker-compose up`. |

---

## 2. Pre-Recording Checklist
- [ ] Docker Compose or local backend running on `http://localhost:8000`.
- [ ] Next.js frontend open on `http://localhost:3000`.
- [ ] If Ollama is installed: run `ollama run llama3.2:3b` in background. If testing without Ollama, select "Resilient Demo Mode" or cloud provider.
- [ ] Screen recorder (Loom, OBS, or QuickTime) set to capture screen + webcam bubble.
