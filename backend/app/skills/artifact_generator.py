"""
Artifact Extractor & Parser for The Lenny Growth Assistant.
Detects and extracts Claude-style <artifact> containers from LLM responses.
"""

import re
from typing import List, Dict, Any, Optional

ARTIFACT_REGEX = re.compile(
    r'<artifact\s+type=["\'](html|markdown)["\']\s+title=["\']([^"\']+)["\']>(.*?)(?:</artifact>|\Z)',
    re.DOTALL | re.IGNORECASE
)

def extract_artifacts(text: str) -> List[Dict[str, str]]:
    """
    Extracts all artifact definitions from text.
    Returns a list of dicts: [{'type': 'html'|'markdown', 'title': '...', 'content': '...'}]
    """
    artifacts = []
    for match in ARTIFACT_REGEX.finditer(text):
        artifact_type = match.group(1).lower().strip()
        title = match.group(2).strip()
        content = match.group(3).strip()
        if content:
            artifacts.append({
                "type": artifact_type,
                "title": title,
                "content": content
            })
    return artifacts

def strip_artifact_tags(text: str) -> str:
    """Removes full artifact blocks from conversational text for clean reading."""
    return ARTIFACT_REGEX.sub(r'\n*[Artifact: \2 (Click to view)]*\n*', text).strip()
