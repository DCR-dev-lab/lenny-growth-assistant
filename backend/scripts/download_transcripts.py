"""
Transcript Download Script for The Lenny Growth Assistant.
Downloads real transcripts from the public GitHub archive (ChatPRD/lennys-podcast-transcripts).
"""

import os
import sys
import argparse
import urllib.request
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("download_transcripts")

DEFAULT_EPISODES = [
    "adam-fishman",
    "elena-verna",
    "shreyas-doshi",
    "brian-chesky",
    "gustaf-alstromer",
    "casey-winters",
    "bob-moesta",
    "gibson-biddle",
]

BASE_URL = "https://raw.githubusercontent.com/ChatPRD/lennys-podcast-transcripts/main/episodes/{episode}/transcript.md"

def download_episode(episode_slug: str, output_dir: str) -> bool:
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"{episode_slug}.md")
    url = BASE_URL.format(episode=episode_slug)
    
    logger.info(f"Downloading transcript for '{episode_slug}'...")
    try:
        urllib.request.urlretrieve(url, out_file)
        size_kb = os.path.getsize(out_file) / 1024
        logger.info(f"Saved '{episode_slug}' ({size_kb:.1f} KB) to {out_file}")
        return True
    except Exception as e:
        logger.error(f"Failed to download '{episode_slug}': {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Download Lenny Podcast Transcripts")
    parser.add_argument("--episodes", nargs="*", default=DEFAULT_EPISODES, help="List of episode slugs to download")
    parser.add_argument("--output", default="data/transcripts", help="Target output directory")
    args = parser.parse_args()

    success_count = 0
    for slug in args.episodes:
        if download_episode(slug, args.output):
            success_count += 1

    logger.info(f"Finished downloading {success_count}/{len(args.episodes)} transcripts into '{args.output}'.")

if __name__ == "__main__":
    main()
