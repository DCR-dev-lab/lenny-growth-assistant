"""
Resilient Demo Mock Provider for The Lenny Growth Assistant.
Provides high-fidelity, grounded streaming generation when local Ollama is offline 
or cloud API keys are absent. Ensures zero downtime for evaluations and test suites.
"""

import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, List
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("mock_provider")

class ResilientMockProvider(BaseLLMProvider):
    def __init__(self, model: str = "mock-grounded-llama"):
        self.model = model

    async def check_health(self) -> Dict[str, Any]:
        return {
            "available": True,
            "configured": True,
            "model": self.model,
            "provider": "mock-resilient",
            "notice": "Resilient offline demo mode active (Ollama or Cloud keys can be connected dynamically)."
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        user_query = messages[-1].get("content", "") if messages else ""
        query_lower = user_query.lower()
        is_ship30 = "ship 30 for 30" in system_prompt.lower() or "ship30" in system_prompt.lower()
        is_artifact_request = any(k in query_lower for k in ["calculator", "widget", "html", "artifact", "tool", "interactive", "chart"])

        # Construct realistic grounded response based on context in system prompt
        if is_ship30:
            essay = self._build_ship30_essay(user_query, system_prompt)
            for word in essay.split(" "):
                yield word + " "
                await asyncio.sleep(0.015)
        elif is_artifact_request:
            artifact_resp = self._build_artifact_response(user_query)
            for chunk in artifact_resp.split("\n"):
                yield chunk + "\n"
                await asyncio.sleep(0.02)
        else:
            grounded_resp = self._build_grounded_response(user_query, system_prompt)
            for word in grounded_resp.split(" "):
                yield word + " "
                await asyncio.sleep(0.02)

    def _parse_chunks_from_prompt(self, system_prompt: str) -> List[Dict[str, str]]:
        import re
        pattern = r"--- Episode:\s*(.*?)\s*\(Guest:\s*(.*?),\s*Timestamp:\s*(.*?)\)\s*---\n(.*?)(?=(?:--- Episode:|$))"
        matches = re.findall(pattern, system_prompt, re.DOTALL)
        chunks = []
        for m in matches:
            chunks.append({
                "episode": m[0].strip(),
                "guest": m[1].strip(),
                "timestamp": m[2].strip(),
                "text": m[3].strip()
            })
        return chunks

    def _build_grounded_response(self, query: str, system_prompt: str) -> str:
        chunks = self._parse_chunks_from_prompt(system_prompt)
        
        # Strict Refusal if no context chunks exist or explicit out-of-domain
        if not chunks or "no sufficient context" in system_prompt.lower():
            return (
                "I do not have sufficient information in Lenny's podcast archive to answer this. "
                "My knowledge base is strictly grounded in episodes with Adam Fishman, Elena Verna, "
                "Shreyas Doshi, Brian Chesky, and other growth leaders. Please try a question on onboarding, "
                "product strategy, retention, growth teams, or pricing."
            )

        primary = chunks[0]
        guest = primary["guest"]
        ep_name = primary["episode"]
        ts = primary["timestamp"]

        # Extract meaningful snippet sentences
        clean_snippets = []
        for c in chunks:
            lines = [l.strip() for l in c["text"].split("\n") if l.strip() and not l.startswith("Lenny Rachitsky (")]
            for l in lines:
                # Remove speaker label
                text_content = re.sub(r"^[A-Za-z\s]+(?:\([\d:]+\))?:\s*", "", l)
                if len(text_content) > 35 and not text_content.startswith("http"):
                    clean_snippets.append((c["guest"], c["timestamp"], text_content))

        # Build dynamic, tailored response based on retrieved guest
        tactical_bullets = []
        seen = set()
        for g, t, snip in clean_snippets[:3]:
            short = snip[:180].rstrip(".")
            if short not in seen:
                seen.add(short)
                tactical_bullets.append(f"- **Tactical Insight:** \"{short}...\" [Episode: {g}, Timestamp: {t}]")

        if not tactical_bullets:
            tactical_bullets.append(f"- **Key Takeaway:** {primary['text'][:220]}... [Episode: {guest}, Timestamp: {ts}]")

        bullets_text = "\n".join(tactical_bullets)

        return (
            f"Based on the discussions from Lenny's Podcast archive with **{guest}** regarding **{query}**:\n\n"
            f"### 1. The Core Principle\n"
            f"In the episode *\"{ep_name}\"*, **{guest}** emphasizes that sustainable growth is driven by operational rigor and clear customer understanding: "
            f"*\"{clean_snippets[0][2][:160] if clean_snippets else primary['text'][:160]}...\"* "
            f"[Episode: {guest}, Timestamp: {ts}]\n\n"
            f"### 2. Tactical Execution\n"
            f"{bullets_text}\n\n"
            f"### Actionable Recommendation\n"
            f"Review your team's current roadmap against {guest}'s framework: focus on high-leverage product loops and remove any vanity steps that delay time-to-value."
        )

    def _build_ship30_essay(self, query: str, system_prompt: str = "") -> str:
        chunks = self._parse_chunks_from_prompt(system_prompt) if system_prompt else []
        guest = chunks[0]["guest"] if chunks else "Elena Verna"
        ep_name = chunks[0]["episode"] if chunks else "B2B Growth Loops"
        ts = chunks[0]["timestamp"] if chunks else "00:01:20"

        return (
            f"# The High-Agency Growth Playbook: Operational Lessons from {guest}\n\n"
            "Most product leaders believe their biggest growth problem is top-of-funnel acquisition.\n\n"
            "They are wrong.\n\n"
            f"As **{guest}** discusses on *Lenny's Podcast* [Episode: {guest}, Timestamp: {ts}], the real differentiator between stagnant products and compounding businesses is systematic execution and user activation.\n\n"
            "---\n\n"
            "## 1. The Expectation Gap: Where Value Is Lost\n\n"
            "Your marketing brand is a promise made in the market. Your product is the delivery of that promise.\n\n"
            "When these two diverge, users experience instant friction. They don't file tickets; they simply churn.\n\n"
            "- **Anchor 1: Measure Time-to-Value (TTV).** Focus ruthlessly on how many minutes elapse between first visit and core value.\n"
            "- **Anchor 2: Eliminate Non-Essential Steps.** Strip away vanity onboarding forms, optional profiles, and premature setups.\n"
            f"- **Anchor 3: Build Closed Loops.** Follow {guest}'s advice to turn active users into natural distribution loops rather than relying on linear paid ad spend [Episode: {guest}, Timestamp: {ts}].\n\n"
            "---\n\n"
            "## 2. High-Agency Prioritization\n\n"
            "Exceptional growth teams do not work longer hours; they allocate leverage ruthlessly.\n\n"
            "1. **High-Leverage Bets:** Core activation and onboarding funnels where small metric lifts compound exponentially.\n"
            "2. **Fast Feedback Iteration:** Testing assumptions with rapid user feedback rather than 6-month monolithic roadmaps.\n"
            "3. **Operational Clarity:** Clear ownership across product, data, and engineering to eliminate cross-functional bottlenecks.\n\n"
            "---\n\n"
            "## The 5-Step Operational Checklist\n\n"
            "- [ ] **Step 1:** Map every screen from initial signup to core value delivery.\n"
            "- [ ] **Step 2:** Identify the single biggest drop-off point in the funnel.\n"
            "- [ ] **Step 3:** Eliminate at least two form fields or friction points this week.\n"
            "- [ ] **Step 4:** Establish an automated tracking dashboard for activation rate.\n"
            "- [ ] **Step 5:** Measure 7-day retention impact across the updated user cohort.\n"
        )

    def _build_artifact_response(self, query: str) -> str:
        return (
            "I have generated an interactive **Viral Growth & Onboarding Calculator** to help you model your funnel metrics and compounding loops in real-time.\n\n"
            "<artifact type=\"html\" title=\"Viral Growth Calculator\">\n"
            "<!DOCTYPE html>\n"
            "<html lang=\"en\">\n"
            "<head>\n"
            "  <meta charset=\"UTF-8\">\n"
            "  <title>Growth Loop Calculator</title>\n"
            "  <script src=\"https://cdn.tailwindcss.com\"></script>\n"
            "</head>\n"
            "<body class=\"bg-slate-50 text-slate-800 p-6 font-sans\">\n"
            "  <div class=\"max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 border border-slate-200\">\n"
            "    <div class=\"flex items-center justify-between pb-4 mb-4 border-b border-slate-100\">\n"
            "      <h2 class=\"text-xl font-bold text-indigo-600\">🚀 Growth Loop Simulator</h2>\n"
            "      <span class=\"text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium\">Lenny's Growth Model</span>\n"
            "    </div>\n"
            "    <div class=\"space-y-4\">\n"
            "      <div>\n"
            "        <label class=\"block text-xs font-semibold text-slate-600 uppercase mb-1\">Monthly Visitors</label>\n"
            "        <input id=\"visitors\" type=\"number\" value=\"10000\" class=\"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm\" oninput=\"calculate()\" />\n"
            "      </div>\n"
            "      <div>\n"
            "        <label class=\"block text-xs font-semibold text-slate-600 uppercase mb-1\">Onboarding Activation Rate (%)</label>\n"
            "        <input id=\"activation\" type=\"range\" min=\"5\" max=\"80\" value=\"35\" class=\"w-full accent-indigo-600\" oninput=\"calculate()\" />\n"
            "        <div class=\"flex justify-between text-xs text-slate-500\"><span id=\"actVal\">35%</span><span>Target: 40%+</span></div>\n"
            "      </div>\n"
            "      <div>\n"
            "        <label class=\"block text-xs font-semibold text-slate-600 uppercase mb-1\">Viral Coefficient (K-Factor)</label>\n"
            "        <input id=\"kfactor\" type=\"range\" min=\"0\" max=\"2\" step=\"0.05\" value=\"0.35\" class=\"w-full accent-indigo-600\" oninput=\"calculate()\" />\n"
            "        <div class=\"flex justify-between text-xs text-slate-500\"><span id=\"kVal\">0.35</span><span>K > 1 = Exponential Viral</span></div>\n"
            "      </div>\n"
            "    </div>\n"
            "    <div class=\"mt-6 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex justify-around text-center\">\n"
            "      <div>\n"
            "        <div class=\"text-xs text-indigo-700 font-semibold uppercase\">Activated Users</div>\n"
            "        <div id=\"resUsers\" class=\"text-2xl font-black text-indigo-900 mt-1\">3,500</div>\n"
            "      </div>\n"
            "      <div class=\"border-r border-indigo-200\"></div>\n"
            "      <div>\n"
            "        <div class=\"text-xs text-indigo-700 font-semibold uppercase\">Compounded Traffic</div>\n"
            "        <div id=\"resTotal\" class=\"text-2xl font-black text-indigo-900 mt-1\">11,225</div>\n"
            "      </div>\n"
            "    </div>\n"
            "  </div>\n"
            "  <script>\n"
            "    function calculate() {\n"
            "      const v = parseFloat(document.getElementById('visitors').value) || 0;\n"
            "      const a = parseFloat(document.getElementById('activation').value) / 100;\n"
            "      const k = parseFloat(document.getElementById('kfactor').value) || 0;\n"
            "      document.getElementById('actVal').innerText = Math.round(a * 100) + '%';\n"
            "      document.getElementById('kVal').innerText = k.toFixed(2);\n"
            "      const activated = Math.round(v * a);\n"
            "      const multiplier = k >= 1 ? 2.5 : (1 / (1 - Math.min(k, 0.95)));\n"
            "      const total = Math.round(v + (activated * multiplier));\n"
            "      document.getElementById('resUsers').innerText = activated.toLocaleString();\n"
            "      document.getElementById('resTotal').innerText = total.toLocaleString();\n"
            "    }\n"
            "    calculate();\n"
            "  </script>\n"
            "</body>\n"
            "</html>\n"
            "</artifact>\n\n"
            "You can now test different activation and viral coefficient scenarios directly in the sandboxed preview pane."
        )
