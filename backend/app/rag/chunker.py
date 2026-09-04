"""
Transcript Chunker for The Lenny Growth Assistant.
Parses YAML frontmatter, identifies speaker dialogue and timestamps,
and chunks text recursively into 500-800 token slices with 100-token overlap.
"""

import re
import os
try:
    import yaml
except ImportError:
    yaml = None
from typing import List, Dict, Any

TIMESTAMP_REGEX = re.compile(r'([A-Za-z\s]+)\s*\(([0-9]{1,2}:[0-9]{2}:[0-9]{2})\):')

def parse_frontmatter(content: str):
    """Extract frontmatter if present at the top of the markdown file."""
    metadata = {
        "guest": "Unknown Guest",
        "title": "Lenny's Podcast Episode",
        "publish_date": "",
        "keywords": []
    }
    
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_yaml = parts[1]
            body = parts[2]
            if yaml is not None:
                try:
                    parsed = yaml.safe_load(raw_yaml)
                    if isinstance(parsed, dict):
                        metadata["guest"] = parsed.get("guest", metadata["guest"])
                        metadata["title"] = parsed.get("title", metadata["title"])
                        metadata["publish_date"] = str(parsed.get("publish_date", ""))
                        metadata["keywords"] = parsed.get("keywords", [])
                except Exception:
                    pass
            else:
                # Simple line-by-line fallback
                for line in raw_yaml.split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k in metadata:
                            metadata[k] = v
            return metadata, body
            
    return metadata, content

def extract_dialogue_blocks(body: str) -> List[Dict[str, Any]]:
    """
    Split body into individual dialogue blocks with speaker and timestamp.
    Example match: 'Adam Fishman (00:00:00):'
    """
    blocks = []
    lines = body.split("\n")
    current_speaker = "Unknown"
    current_timestamp = "00:00:00"
    current_text = []

    for line in lines:
        match = TIMESTAMP_REGEX.match(line.strip())
        if match:
            if current_text:
                text_content = "\n".join(current_text).strip()
                if text_content:
                    blocks.append({
                        "speaker": current_speaker,
                        "timestamp": current_timestamp,
                        "text": text_content
                    })
                current_text = []
            current_speaker = match.group(1).strip()
            current_timestamp = match.group(2).strip()
            remainder = line.strip()[match.end():].strip()
            if remainder:
                current_text.append(remainder)
        else:
            current_text.append(line)

    if current_text:
        text_content = "\n".join(current_text).strip()
        if text_content:
            blocks.append({
                "speaker": current_speaker,
                "timestamp": current_timestamp,
                "text": text_content
            })

    return blocks

def chunk_transcript(
    file_path: str,
    target_tokens: int = 600,
    overlap_tokens: int = 100
) -> List[Dict[str, Any]]:
    """
    Reads a transcript markdown file and produces windowed chunks with metadata.
    Estimates 1 token ≈ 4 characters.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    metadata, body = parse_frontmatter(content)
    blocks = extract_dialogue_blocks(body)

    # If no timestamped dialogue blocks found, chunk raw body
    if not blocks:
        chars_per_chunk = target_tokens * 4
        chars_overlap = overlap_tokens * 4
        chunks = []
        start = 0
        while start < len(body):
            end = min(start + chars_per_chunk, len(body))
            slice_text = body[start:end].strip()
            if slice_text:
                chunks.append({
                    "episode_title": metadata["title"],
                    "guest_name": metadata["guest"],
                    "publish_date": metadata["publish_date"],
                    "timestamp_ref": "00:00:00",
                    "chunk_text": slice_text
                })
            start += chars_per_chunk - chars_overlap
        return chunks

    # Combine blocks into ~500-800 token chunks
    target_chars = target_tokens * 4
    chunks = []
    current_chunk_blocks = []
    current_chars = 0
    first_timestamp = blocks[0]["timestamp"] if blocks else "00:00:00"

    for block in blocks:
        block_text = f"{block['speaker']} ({block['timestamp']}): {block['text']}"
        block_len = len(block_text)

        if current_chars + block_len > target_chars and current_chunk_blocks:
            # Emit chunk
            joined_text = "\n\n".join(current_chunk_blocks)
            chunks.append({
                "episode_title": metadata["title"],
                "guest_name": metadata["guest"],
                "publish_date": metadata["publish_date"],
                "timestamp_ref": first_timestamp,
                "chunk_text": joined_text
            })

            # Overlap: keep last block if reasonable
            if len(current_chunk_blocks) > 1:
                last_block = current_chunk_blocks[-1]
                current_chunk_blocks = [last_block, block_text]
                current_chars = len(last_block) + block_len
                first_timestamp = block["timestamp"]
            else:
                current_chunk_blocks = [block_text]
                current_chars = block_len
                first_timestamp = block["timestamp"]
        else:
            if not current_chunk_blocks:
                first_timestamp = block["timestamp"]
            current_chunk_blocks.append(block_text)
            current_chars += block_len

    if current_chunk_blocks:
        joined_text = "\n\n".join(current_chunk_blocks)
        chunks.append({
            "episode_title": metadata["title"],
            "guest_name": metadata["guest"],
            "publish_date": metadata["publish_date"],
            "timestamp_ref": first_timestamp,
            "chunk_text": joined_text
        })

    return chunks
