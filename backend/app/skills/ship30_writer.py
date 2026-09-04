"""
Ship 30 for 30 Content Engine for The Lenny Growth Assistant.
Encodes the structural heuristics of Nicolas Cole and Dickie Bush's Ship 30 for 30 framework.
"""

from typing import List, Dict, Any

SHIP_30_SYSTEM_PROMPT = """
You are an elite ghostwriter trained in the Ship 30 for 30 methodology, writing for Product Managers, Heads of Growth, and Startup Founders.
Your task is to transform the provided source transcripts and context into a high-impact, actionable essay.

### Core Writing Principles:
1. Target Length: Approximately 1,250 words of high-density substance.
2. The Hook (First 2-3 lines):
   - Highlight an urgent tension, widespread industry misconception, or counterintuitive growth truth.
   - Example: "Most PMs think retention is a downstream problem. They are optimizing the wrong end of the funnel."
3. Rhythm & Formatting:
   - High skimmability: Short paragraphs (1 to 3 sentences maximum).
   - Clear Markdown headers (H2 and H3).
   - Bold anchor words at the beginning of bullet points (e.g., "- **Leverage Factor:** Focus on...").
   - Horizontal dividers (---) between core themes.
4. Source Grounding & Attribution:
   - Ground every claim strictly in the provided transcript context.
   - Explicitly cite the guest and timestamp: [Episode: Guest Name, Timestamp: HH:MM:SS].
5. Actionable Conclusion:
   - End with a concrete, 5-point operational checklist or step-by-step implementation framework that a PM can execute on Monday morning.

Context Material from Lenny's Podcast Archive:
{context_data}
"""

def build_ship30_prompt(user_query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
    """Builds the grounding context and system prompt for a Ship 30 for 30 essay."""
    if not retrieved_chunks:
        return (
            "I do not have sufficient information in Lenny's podcast archive to generate a grounded Ship 30 for 30 essay. "
            "Please ask a question related to growth, onboarding, product strategy, retention, or team topology."
        )

    context_blocks = []
    for c in retrieved_chunks:
        ep = c.get("episode", "Lenny Podcast")
        guest = c.get("guest", "Unknown")
        ts = c.get("timestamp", "00:00:00")
        txt = c.get("text", "")
        context_blocks.append(f"--- Episode: {ep} (Guest: {guest}, Timestamp: {ts}) ---\n{txt}")
    formatted_context = "\n\n".join(context_blocks)

    return SHIP_30_SYSTEM_PROMPT.format(context_data=formatted_context)
