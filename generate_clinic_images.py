#!/usr/bin/env python3
"""
Clinic Image Generator — visits 5 clinic websites per day (spaced ~2 hrs apart),
analyzes their aesthetic, then generates a realistic AI photo for each clinic page.

Uses Pollinations.ai — 100% FREE, no API key required.
Model: Flux (photorealistic, high quality)

Usage:
  python3 generate_clinic_images.py

  # Run as cron (5 per day, spaced out):
  # 0 8,10,13,16,18 * * * python3 /home/user/IV-therapy/generate_clinic_images.py >> /home/user/IV-therapy/image_gen.log 2>&1
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
    except Exception:
        return ""


# ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

def build_image_prompt(clinic: dict, enrichment: dict | None, website_text: str) -> str:
    """Build a photorealistic prompt for the clinic."""
    name = clinic['name']
    city = clinic['city']
    state = clinic['state']
    specialties = enrichment.get('specialties', []) if enrichment else []

    text_lower = (website_text + name).lower()
    is_luxury = any(w in text_lower for w in ['luxury', 'premium', 'elite', 'upscale', 'boutique', 'spa'])
    is_medical = any(w in text_lower for w in ['naturopathic', 'physician', 'md ', 'doctor', 'clinical', 'medical', 'infusion center'])

    if is_luxury:
        style = "upscale luxury wellness spa"
        lighting = "warm amber accent lighting, elegant decor with gold fixtures"
        setting = "plush reclining treatment chairs in a beautifully designed room with marble accents and soft lighting"
    elif is_medical:
        style = "professional medical infusion center"
        lighting = "bright clean clinical lighting with warm undertones"
        setting = "clinical treatment chairs arranged in private bays with IV stands and medical-grade equipment"
    else:
        style = "modern hydration wellness clinic"
        lighting = "bright natural light flooding through large windows, clean minimalist design"
        setting = "comfortable padded reclining chairs in a clean, inviting open room"

    treatment_context = ""
    if specialties:
        top = specialties[:2]
        treatment_context = f"Clinic specializes in {' and '.join(top)}. "

    prompt = (
        f"Professional interior photography of a {style} in {city}, {state}. "
        f"{setting}. {treatment_context}"
        f"IV drip bags hanging from polished stainless steel poles with clear medical tubing. "
        f"{lighting}. "
        f"A nurse in scrubs attending to a relaxed smiling patient. "
        f"Clean modern inviting healthcare environment. "
        f"Shot on Canon EOS R5 with 24-70mm f/2.8 lens, shallow depth of field. "
        f"Photorealistic DSLR photo, 8K resolution, editorial healthcare photography. "
        f"No text overlays, no watermarks, no cartoon style, fully realistic."
    )
    return prompt


# ─── IMAGE GENERATION via Pollinations.ai (FREE) ─────────────────────────────

def generate_image(prompt: str, slug: str) -> str | None:
    """
    Call Pollinations.ai (free, no API key) to generate a realistic image.
    Uses the Flux model which produces photorealistic results.
    """
    encoded_prompt = urllib.parse.quote(prompt)
    # width=1792 height=1024 for landscape hero image
    # model=flux for best photorealism
    # nologo=true removes watermark
    # seed makes it reproducible
    import hashlib
    seed = int(hashlib.md5(slug.encode()).hexdigest()[:8], 16) % 1000000

    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width=1792&height=1024&model=flux&nologo=true&seed={seed}&enhance=true"
    )

    image_path = IMAGE_DIR / f"{slug}.jpg"

    print(f"  Requesting from Pollinations.ai (Flux model)...")
    print(f"  This may take 20-40 seconds...")

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 IVDirectory/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
            # Check it's actually an image (not an error page)
            if len(data) < 5000:
                print(f"  Response too small ({len(data)} bytes) — likely an error")
                return None
            if not (data[:3] == b'\xff\xd8\xff' or data[:8] == b'\x89PNG\r\n\x1a\n' or data[:4] == b'RIFF'):
                # Try to decode as text to see the error
                try:
                    err = data[:200].decode('utf-8', errors='replace')
                    print(f"  Non-image response: {err}")
                except:
                    pass
                return None
            image_path.write_bytes(data)
            print(f"  Image saved: {image_path.name} ({len(data) // 1024}KB)")
            return f"/clinic-images/{slug}.jpg"
    except urllib.error.HTTPError as e:
        print(f"  HTTP error: {e.code} {e.reason}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None


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
    clinics = json.loads(CLINICS_FILE.read_text())
    enriched = json.loads(ENRICHED_FILE.read_text())
    images = load_images()
    log = load_log()

    completed_slugs = {entry["slug"] for entry in log.get("completed", [])}

    # Find next clinic to process
    pending = [
        c for c in clinics
        if c["slug"] not in completed_slugs
        and c.get("website")
        and c["slug"] not in images
    ]

    if not pending:
        print("All clinics have been processed!")
        return

    clinic = pending[0]
    slug = clinic["slug"]
    print(f"\nProcessing: {clinic['name']} ({clinic['city']}, {clinic['state']})")
    print(f"  Website: {clinic.get('website', 'none')}")
    print(f"  Remaining in queue: {len(pending)}")
    print(f"  Cost: FREE (Pollinations.ai)")

    # Scrape website for vibe detection
    print(f"  Scraping website...")
    website_text = scrape_website(clinic.get("website", ""))
    print(f"  Got {len(website_text)} chars of text")

    # Build prompt
    enrichment = enriched.get(slug)
    prompt = build_image_prompt(clinic, enrichment, website_text)
    print(f"  Prompt: {prompt[:120]}...")

    # Generate image
    image_path = generate_image(prompt, slug)

    if not image_path:
        print(f"  Image generation failed — will retry next run")
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
    branch = "claude/consolidate-iv-therapy-data-W2wOV"
    os.system(f"""
        cd {BASE} && \
        git add iv-app/data/clinic_images.json iv-app/data/image_generation_log.json iv-app/public/clinic-images/ && \
        git commit -m "Add AI image: {slug}" && \
        git push -u origin {branch}
    """)

    print(f"\n  Done! Image: {image_path}")
    print(f"  Total completed: {len(log['completed'])}/273")
    print(f"  At 5/day this completes in ~{len(pending)//5} more days")


if __name__ == "__main__":
    main()
