#!/usr/bin/env python3
"""
Clinic Image Generator — visits 5 clinic websites per day (spaced ~2 hrs apart),
analyzes their aesthetic, then generates a realistic AI photo for each clinic page.

Requirements:
  pip3 install requests beautifulsoup4 openai

Usage:
  export OPENAI_API_KEY="sk-..."
  python3 generate_clinic_images.py

  # Run as cron (5 per day, every 2.5 hours 8am-8pm):
  # 0 8,10,13,16,18 * * * OPENAI_API_KEY=sk-... python3 /home/user/IV-therapy/generate_clinic_images.py >> /home/user/IV-therapy/image_gen.log 2>&1

Image model: DALL-E 3 (dall-e-3)
  - Highly realistic, no cartoon style
  - Perfect for healthcare/medical aesthetics
  - $0.04 per image (1024x1024 standard)
  - 5 images/day = $0.20/day = ~$6/month
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import re
from pathlib import Path
from datetime import date

BASE = Path("/home/user/IV-therapy")
CLINICS_FILE = BASE / "iv-app/data/clinics.json"
ENRICHED_FILE = BASE / "iv-app/data/enriched.json"
IMAGES_FILE = BASE / "iv-app/data/clinic_images.json"
LOG_FILE = BASE / "iv-app/data/image_generation_log.json"
IMAGE_DIR = BASE / "iv-app/public/clinic-images"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
IMAGES_PER_RUN = 1  # Generate 1 image per run; schedule 5x/day via cron
MAX_COST_PER_RUN = 0.10  # Kill switch: $0.04/image × 1 = $0.04, cap at $0.10

IMAGE_DIR.mkdir(exist_ok=True)


# ─── WEBSITE SCRAPER ──────────────────────────────────────────────────────────

def scrape_website(url: str) -> str:
    """Fetch visible text from clinic website to understand their vibe."""
    if not url:
        return ""
    url = re.sub(r'%3F.*', '', url).split('?')[0]
    if not url.startswith('http'):
        url = 'http://' + url
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        # Strip scripts/styles
        html = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', html)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:3000]
    except Exception as e:
        return ""


# ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

def build_image_prompt(clinic: dict, enrichment: dict | None, website_text: str) -> str:
    """Build a DALL-E 3 prompt for a realistic clinic photo."""
    name = clinic['name']
    city = clinic['city']
    state = clinic['state']
    specialties = enrichment.get('specialties', []) if enrichment else []

    # Detect clinic vibe from website text and name
    text_lower = (website_text + name).lower()
    is_luxury = any(w in text_lower for w in ['luxury', 'premium', 'elite', 'upscale', 'boutique', 'spa'])
    is_medical = any(w in text_lower for w in ['naturopathic', 'physician', 'md ', 'doctor', 'clinical', 'medical', 'infusion center'])
    is_wellness = any(w in text_lower for w in ['wellness', 'holistic', 'integrative', 'natural'])

    # Build descriptive style tag
    if is_luxury:
        style = "upscale luxury wellness spa"
        lighting = "warm amber accent lighting, elegant decor"
        setting = "plush reclining treatment chairs in a beautifully designed room with marble accents"
    elif is_medical:
        style = "professional medical infusion center"
        lighting = "bright clean clinical lighting with warm undertones"
        setting = "clinical treatment chairs arranged in private bays with medical-grade IV equipment"
    else:
        style = "modern wellness hydration clinic"
        lighting = "bright natural light, clean minimalist design"
        setting = "comfortable reclining chairs in a clean, inviting room"

    # Treatment context
    treatment_context = ""
    if specialties:
        top = specialties[:2]
        treatment_context = f"The clinic specializes in {' and '.join(top)}. "

    prompt = (
        f"Professional interior photography of a {style} in {city}, {state}. "
        f"{setting}. {treatment_context}"
        f"IV drip bags hanging on polished stainless steel poles, clear tubing. "
        f"{lighting}. "
        f"A nurse or medical professional in scrubs attending to a relaxed patient. "
        f"Clean, modern, inviting atmosphere. "
        f"Shot on a Sony A7R IV with a 24-70mm f/2.8 lens. "
        f"Editorial healthcare photography style, photorealistic, 8K detail. "
        f"No text, no watermarks, no cartoon elements, no illustrations. "
        f"Realistic skin tones, real medical equipment."
    )
    return prompt


# ─── IMAGE GENERATION ─────────────────────────────────────────────────────────

def generate_image(prompt: str, slug: str) -> str | None:
    """Call DALL-E 3 API, save image, return local path."""
    if not OPENAI_API_KEY:
        print("  ERROR: OPENAI_API_KEY not set")
        sys.exit(1)

    # Call DALL-E 3
    payload = json.dumps({
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1792x1024",  # landscape format, great for clinic hero images
        "quality": "standard",
        "style": "natural",  # "natural" = more realistic, less stylized
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  DALL-E API error: {e.code} — {body[:300]}")
        return None

    image_url = result["data"][0]["url"]
    revised_prompt = result["data"][0].get("revised_prompt", "")
    print(f"  Revised prompt: {revised_prompt[:100]}...")

    # Download the image
    image_path = IMAGE_DIR / f"{slug}.jpg"
    req2 = urllib.request.Request(image_url, headers={"User-Agent": "IVDirectory/1.0"})
    with urllib.request.urlopen(req2, timeout=30) as resp:
        image_path.write_bytes(resp.read())

    print(f"  Image saved: {image_path.name} ({image_path.stat().st_size // 1024}KB)")
    return f"/clinic-images/{slug}.jpg"


# ─── PROGRESS TRACKING ────────────────────────────────────────────────────────

def load_log() -> dict:
    return json.loads(LOG_FILE.read_text())


def save_log(log: dict):
    LOG_FILE.write_text(json.dumps(log, indent=2))


def load_images() -> dict:
    return json.loads(IMAGES_FILE.read_text())


def save_images(images: dict):
    IMAGES_FILE.write_text(json.dumps(images, indent=2))


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    if not OPENAI_API_KEY:
        print("ERROR: Set OPENAI_API_KEY:")
        print("  export OPENAI_API_KEY='sk-...'")
        sys.exit(1)

    clinics = json.loads(CLINICS_FILE.read_text())
    enriched = json.loads(ENRICHED_FILE.read_text())
    images = load_images()
    log = load_log()

    completed_slugs = {entry["slug"] for entry in log.get("completed", [])}

    # Find next clinic to process (with a website, not yet done)
    pending = [
        c for c in clinics
        if c["slug"] not in completed_slugs
        and c.get("website")
        and c["slug"] not in images  # skip if already has image
    ]

    if not pending:
        print("All clinics have been processed!")
        return

    clinic = pending[0]
    slug = clinic["slug"]
    print(f"Processing: {clinic['name']} ({clinic['city']}, {clinic['state']})")
    print(f"  Website: {clinic.get('website', 'none')}")
    print(f"  Remaining in queue: {len(pending)}")
    print(f"  Estimated cost: $0.04 (1792×1024 DALL-E 3 standard)")

    # Scrape website
    print(f"  Scraping website...")
    website_text = scrape_website(clinic.get("website", ""))
    print(f"  Got {len(website_text)} chars of text")

    # Build prompt
    enrichment = enriched.get(slug)
    prompt = build_image_prompt(clinic, enrichment, website_text)
    print(f"  Prompt: {prompt[:120]}...")

    # Generate image
    print(f"  Generating image with DALL-E 3...")
    image_path = generate_image(prompt, slug)

    if not image_path:
        print(f"  Image generation failed — skipping")
        return

    # Save to clinic_images.json
    images[slug] = {
        "path": image_path,
        "generatedAt": date.today().isoformat(),
        "prompt": prompt[:300],
    }
    save_images(images)

    # Update log
    log.setdefault("completed", []).append({
        "slug": slug,
        "name": clinic["name"],
        "date": date.today().isoformat(),
        "imagePath": image_path,
    })
    save_log(log)

    # Commit to git
    os.system(f"""
        cd {BASE} && \
        git add iv-app/data/clinic_images.json iv-app/data/image_generation_log.json iv-app/public/clinic-images/ && \
        git commit -m "Add AI image: {slug}" && \
        git push -u origin main
    """)

    print(f"  Done! Image: {image_path}")
    print(f"  Total completed: {len(log['completed'])}")


if __name__ == "__main__":
    main()
