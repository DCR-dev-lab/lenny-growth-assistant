# Demo Video Script (Human & Fresher-Friendly)
## The Lenny Growth Assistant
**Duration:** ~2 minutes (~260 words)  
**Tone:** Natural, friendly, confident, and direct. No complex jargon.  
**Setup:** Screen open on \http://localhost:3000\, webcam bubble in the corner.

---

### [0:00 – 0:25] Introduction & The Problem
**Action:** Smile at camera, screen shows the homepage.

> *"Hey everyone! My name is [Your Name], and this is my take-home project: **The Lenny Growth Assistant**.*  
>  
> *Lenny's Podcast has hundreds of hours of great growth advice from people like Elena Verna and Shreyas Doshi. But listening to all those episodes takes way too long, and normal ChatGPT often makes up generic or fake advice.*  
>  
> *So I built a full-stack web app that gives verified, timestamped answers directly from the podcast transcripts—plus generates essays and interactive tools."*

---

### [0:25 – 0:55] Local Ollama & Grounded Answers
**Action:** Point to the top-right model badge showing **\Ollama (3.2)\**. Click the first card: *"Onboarding as a Growth Lever"* and hit Enter.

> *"First, everything here is running 100% locally on my machine using **Ollama with Llama 3.2 3B**. No API keys needed, and no data leaves my computer.*  
>  
> *Let's ask: 'What does Adam Fishman say about onboarding?'*  
>  
> *It searches our PostgreSQL vector database, and here’s the answer. Look at the citation: it gives the exact episode and timestamp: **[Adam Fishman, 00:00:00]**.*  
>  
> *I can even click these source pills below to see the exact transcript quote and match score."*

---

### [0:55 – 1:15] Guardrail / Refusal Check
**Action:** Type or click: *"How do I bake sourdough bread?"* and hit Enter.

> *"Now, what if someone asks an unrelated question, like 'How do I bake sourdough bread?'*  
>  
> *Watch this: it immediately refuses to answer.*  
>  
> *Because the similarity score is too low, the guardrail stops the AI from hallucinating and politely reminds the user to ask about growth topics."*

---

### [1:15 – 1:45] Ship 30 Mode & Interactive Canvas
**Action:** Click the **\QA\** button in the prompt bar (it turns amber **\Ship 30\**). Click the 3rd card: *"Interactive Viral Calculator"* and hit Enter.

> *"Next, we have a **Ship 30 for 30 mode** for clean, skimmable writing.*  
>  
> *If I ask it to build an interactive viral loop calculator, look what happens: it automatically opens this side canvas beside the chat!*  
>  
> *This is a working HTML/CSS calculator. I can drag the activation slider and viral coefficient slider, and the math updates live.*  
>  
> *For security, the code runs in a sandboxed iframe with DOMPurify, so it's isolated and completely safe."*

---

### [1:45 – 2:15] Technical Trade-off & Wrap-up
**Action:** Click the Model Selector dropdown showing Ollama, Claude, GPT-4o, and Demo mode.

> *"Finally, a quick technical trade-off:*  
>  
> *Running local Ollama on CPU is great for privacy and it's completely free, but it can be a bit slower on heavy queries. Cloud models like Claude or GPT-4o are faster, but they cost money.*  
>  
> *So I built a provider toggle right here. You can run local Ollama by default, switch to cloud APIs with a key, or use our offline demo mode.*  
>  
> *The entire app—database, Ollama, backend, and frontend—starts with just one command: \docker-compose up\.*  
>  
> *Thanks so much for watching!"*
