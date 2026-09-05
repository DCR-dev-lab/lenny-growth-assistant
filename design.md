# UI/UX Design Specification
## Project: The Lenny Growth Assistant

**Status:** Approved  
**Author:** Forward Deployed Engineering  

---

## 1. Design Philosophy & Principles

The Lenny Growth Assistant is designed specifically for **Product Managers, Growth Leaders, and Founders** who require rapid, high-density, authoritative insights without cognitive friction.

### Core Principles:
1. **Source Transparency First:** Trust is paramount. Citations are not hidden behind tooltips; they are prominent, verifiable, and visually distinct.
2. **Side-by-Side Dual Pane:** Moving away from traditional conversational dead-ends where code or essays clutter the message bubble. Artifacts live in a dedicated workspace pane.
3. **High-Retention Skimmability (Ship 30 for 30 Heuristic):** Visual typography optimizes for busy executives with bold lead-ins, short paragraphs, and clear hierarchy.
4. **Resilient Feedback:** When retrieval is processing, streaming, or refusing out-of-domain queries, the UI provides immediate visual reassurance.

---

## 2. Information Architecture & Layout

The interface implements a responsive, two-pane layout with a collapsible navigation drawer:

```
+-----------------------------------------------------------------------------------------+
| [Oogway / Lenny Assistant Logo]   [Mode: Grounded QA | Ship 30]   [Model: Ollama (Local)]|
+-------------------+---------------------------------------+-----------------------------+
| SESSIONS (260px)  | CHAT PANE (Flexible ~50-60%)          | ARTIFACT VIEWER (~40-50%)   |
|                   |                                       |                             |
| + New Chat        | User: What did Adam Fishman say about | [HTML / Markdown Badge]     |
|                   |       onboarding?                     | Title: Growth Loop Calculator|
| Recent Sessions:  |                                       | [Copy Code] [Fullscreen] [X]|
| - Onboarding Flow | Assistant: [Streaming response...]    |                             |
| - PLG Pricing     | Onboarding is the only part of your   | +-------------------------+ |
| - Growth Loops    | product that 100% of users touch...   | |                         | |
|                   |                                       | |   [Live Sandboxed]      | |
|                   | Sources:                              | |   [Interactive Widget]  | |
|                   | [Adam Fishman (00:00:00)]             | |                         | |
|                   |                                       | +-------------------------+ |
|                   | [Artifact Generated: Click to View]   |                             |
|                   +---------------------------------------+                             |
|                   | [Input box: Ask Lenny Assistant...]   |                             |
+-------------------+---------------------------------------+-----------------------------+
```

---

## 3. Key Interaction States

### 3.1 Idle State
- Clean input field with quick-start prompt chips:
  - *"How does Adam Fishman think about onboarding as a growth lever?"*
  - *"Write a Ship 30 for 30 essay on Product-Led Growth frameworks."*
  - *"Generate an interactive HTML viral growth calculator."*

### 3.2 Retrieval & Thinking State
- Pulsing indicator: *"Retrieving transcripts from Lenny's archive..."*
- Real-time status messages streamed via SSE before tokens appear, keeping perceived latency under $500\text{ms}$.

### 3.3 Streaming & Citation Rendering State
- Assistant tokens stream smoothly using incremental DOM updates.
- Source citations appear as interactive pills at the base of the assistant message. Clicking a citation pill reveals the exact transcript snippet and timestamp.

### 3.4 Artifact State
- When an `<artifact>` tag is streamed, the chat pane renders an animated "Opening Artifact..." card.
- The right-hand panel slides into view (or replaces the split view).
- For HTML artifacts: A sandboxed preview renders the live, interactive widget with a toggle to view the raw code.
- For Markdown artifacts: Styled typography with syntax-highlighted code blocks.

### 3.5 Out-of-Domain Refusal State
- When cosine similarity falls below $0.60$, the assistant gently but firmly renders an amber notice:
  > *"I do not have sufficient information in Lenny's podcast archive to answer this. My knowledge is strictly grounded in episodes with Adam Fishman, Elena Verna, Shreyas Doshi, Brian Chesky, and other growth leaders."*

---

## 4. Responsive & Mobile Behavior

- **Desktop ($\ge 1024\text{px}$):** Persistent three-column or two-pane split with adjustable drawer.
- **Tablet ($768\text{px} - 1023\text{px}$):** Collapsible session sidebar; chat and artifact split 50/50 with toggle.
- **Mobile ($< 768\text{px}$):** Single column. When an artifact is opened, it slides up as a full-screen modal drawer with a sticky close button.

---

## 5. Accessibility Considerations (WCAG 2.1 AA)

- **Contrast Ratios:** Text colors adhere to $\ge 4.5:1$ contrast against light/dark backgrounds.
- **Keyboard Navigation:** All buttons, session selectors, mode pills, and artifact controls are keyboard accessible with visible `:focus-visible` rings.
- **Screen Reader Support:** ARIA live regions (`aria-live="polite"`) announce new incoming streaming messages and artifact launches.
- **Iframe Isolation:** Sandboxed iframes have descriptive `title` attributes for assistive technologies.
