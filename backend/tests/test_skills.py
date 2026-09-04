"""
Unit tests for Ship 30 for 30 Content Engine and Claude-style Artifact Generator.
"""

try:
    import pytest
except ImportError:
    pytest = None
from app.skills.ship30_writer import build_ship30_prompt, SHIP_30_SYSTEM_PROMPT
from app.skills.artifact_generator import extract_artifacts, strip_artifact_tags

def test_ship30_prompt_structure():
    """Verifies that Ship 30 prompt injects the ~1,250 word target, hook, and bold anchors."""
    sample_chunks = [
        {
            "episode": "Adam Fishman on Growth",
            "guest": "Adam Fishman",
            "timestamp": "00:00:00",
            "text": "Onboarding is the only part of your product experience that 100% of users touch."
        }
    ]
    prompt = build_ship30_prompt("How to optimize onboarding", sample_chunks)
    assert "Ship 30 for 30" in prompt
    assert "1,250 words" in prompt
    assert "Adam Fishman" in prompt
    assert "Onboarding is the only part" in prompt
    assert "[Episode: Guest Name, Timestamp: HH:MM:SS]" in prompt

def test_ship30_prompt_empty_chunks():
    """Verifies refusal if no grounded chunks are available."""
    prompt = build_ship30_prompt("Quantum computing", [])
    assert "do not have sufficient information" in prompt

def test_extract_html_artifact():
    """Verifies extraction of HTML artifact containers."""
    sample_text = """
    Here is an interactive calculator:
    <artifact type="html" title="Viral Coefficient Calculator">
    <!DOCTYPE html>
    <html><body><button id="btn">Click me</button></body></html>
    </artifact>
    Use this to simulate viral loops.
    """
    artifacts = extract_artifacts(sample_text)
    assert len(artifacts) == 1
    assert artifacts[0]["type"] == "html"
    assert artifacts[0]["title"] == "Viral Coefficient Calculator"
    assert "<button id=\"btn\">" in artifacts[0]["content"]

def test_extract_markdown_artifact():
    """Verifies extraction of Markdown document containers."""
    sample_text = """
    <artifact type="markdown" title="Growth Strategy Memo">
    # Growth Strategy
    - **Anchor:** Retention first.
    </artifact>
    """
    artifacts = extract_artifacts(sample_text)
    assert len(artifacts) == 1
    assert artifacts[0]["type"] == "markdown"
    assert artifacts[0]["title"] == "Growth Strategy Memo"
    assert "- **Anchor:** Retention first." in artifacts[0]["content"]

def test_strip_artifact_tags():
    """Verifies stripping of raw artifact markup for clean chat bubble display."""
    text = "Before <artifact type=\"html\" title=\"Test\"><div>content</div></artifact> After"
    cleaned = strip_artifact_tags(text)
    assert "<div>content</div>" not in cleaned
    assert "Artifact: Test" in cleaned
