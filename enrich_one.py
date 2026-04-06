#!/usr/bin/env python3
"""Enrich one IV therapy clinic: scrape website, analyze with claude, save to enriched.json."""

import json
import sys
import subprocess
import re
import urllib.request
import urllib.error
from pathlib import Path

BASE = Path("/home/user/IV-therapy")
CLINICS_FILE = BASE / "iv-app/data/clinics.json"
ENRICHED_FILE = BASE / "iv-app/data/enriched.json"

def load_next_clinic():
    clinics = json.loads(CLINICS_FILE.read_text())
    enriched = json.loads(ENRICHED_FILE.read_text())
    unenriched = [c for c in clinics if c["slug"] not in enriched]
    if not unenriched:
        return None, None
    print(f"{len(unenriched)} remaining")
    return unenriched[0], len(unenriched)

def fetch_website(url: str, timeout: int = 10) -> str:
    """Fetch a URL and return visible text (stripped of tags)."""
    if not url:
        return ""
    # Clean up URL
    url = url.split("%3F")[0].split("?")[0]  # strip encoded query strings
    if not url.startswith("http"):
        url = "http://" + url
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; IVDirectory/1.0)"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [fetch error] {e}")
        return ""

    # Strip script/style tags
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Limit to first 4000 chars
    return text[:4000]

def analyze_with_claude(slug: str, name: str, website_text: str) -> dict | None:
    prompt = f"""You are enriching a database of IV therapy clinics.

Clinic: {name}
Slug: {slug}

Website content (scraped):
\"\"\"
{website_text if website_text else "[Website unavailable - use industry norms]"}
\"\"\"

Based on the content above, return a JSON object with enrichment data for this clinic.
Use industry-norm values for any fields not found. Do NOT use markdown. Return ONLY the JSON object.

Format:
{{
  "{slug}": {{
    "sessionDuration": "...",
    "whatIsIncluded": "...",
    "firstVisitInfo": "...",
    "frequency": "...",
    "specialties": ["...", "...", "..."],
    "priceNote": "..."
  }}
}}"""

    result = subprocess.run(
        ["claude", "--print", prompt],
        capture_output=True,
        text=True,
        timeout=120,
        cwd="/tmp",  # run outside git repo to avoid hooks/context
    )
    output = result.stdout.strip()
    if result.returncode != 0:
        print(f"  [claude error] {result.stderr[:200]}")
        return None

    # Extract JSON
    match = re.search(r"\{[\s\S]*\}", output)
    if not match:
        print(f"  [parse error] no JSON found in: {output[:200]}")
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError as e:
        print(f"  [json error] {e}: {match.group()[:200]}")
        return None

def save_enrichment(data: dict):
    enriched = json.loads(ENRICHED_FILE.read_text())
    enriched.update(data)
    ENRICHED_FILE.write_text(json.dumps(enriched, indent=2))
    print(f"  Saved. Total enriched: {len(enriched)}")

def git_commit(slug: str):
    subprocess.run(
        ["git", "add", "iv-app/data/enriched.json"],
        cwd=BASE, check=True
    )
    subprocess.run(
        ["git", "commit", "-m", f"Enrich: {slug}"],
        cwd=BASE, check=True
    )
    subprocess.run(
        ["git", "push", "-u", "origin", "main"],
        cwd=BASE, check=True
    )
    print(f"  Committed and pushed.")

def main():
    clinic, remaining = load_next_clinic()
    if not clinic:
        print("All clinics enriched!")
        sys.exit(0)

    slug = clinic["slug"]
    name = clinic["name"]
    website = clinic.get("website", "") or ""

    print(f"Enriching: {slug}")
    print(f"  Website: {website}")

    text = fetch_website(website)
    print(f"  Scraped {len(text)} chars")

    data = analyze_with_claude(slug, name, text)
    if not data:
        print("  Failed to get enrichment data. Skipping.")
        sys.exit(1)

    save_enrichment(data)
    git_commit(slug)
    print(f"Done. {remaining - 1} remaining.")

if __name__ == "__main__":
    main()
