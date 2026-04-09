#!/usr/bin/env python3
"""
Clinic Image Generator — generates realistic AI photos for clinic pages using
Google Imagen 3 via the Gemini API (free tier: 150 images/day).

Run from your LOCAL machine (Google blocks this API from cloud server IPs):

  GEMINI_API_KEY="AIza..." python3 generate_clinic_images.py

Or set it once:
  export GEMINI_API_KEY="AIza..."
  python3 generate_clinic_images.py   # generates 1 image per run

Cron (5/day on your local machine):
  0 8,10,13,16,18 * * * cd /path/to/IV-therapy && GEMINI_API_KEY="AIza..." python3 generate_clinic_images.py >> image_gen.log 2>&1
"""

import base64
import json
import os
import sys
import urllib.request
import urllib.parse
import re
from pathlib import Path
from datetime import date

BASE = Path(__file__).parent
CLINICS_FILE = BASE / "iv-app/data/clinics.json"
ENRICHED_FILE = BASE / "iv-app/data/enriched.json"
IMAGES_FILE = BASE / "iv-app/data/clinic_images.json"
LOG_FILE = BASE / "iv-app/data/image_generation_log.json"
IMAGE_DIR = BASE / "iv-app/public/clinic-images"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
IMAGE_DIR.mkdir(exist_ok=True)


# ─── WEBSITE SCRAPER ──────────────────────────────────────────────────────────

def scrape_website(url: str) -> str:
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
        html = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', html)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:3000]
    except Exception:
        return ""


# ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

def build_image_prompt(clinic: dict, enrichment: dict | None, website_text: str) -> str:
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

    return (
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


# ─── IMAGE GENERATION via Google Imagen 3 (Gemini API, free) ─────────────────

def generate_image(prompt: str, slug: str) -> str | None:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"imagen-3.0-fast-generate-001:predict?key={GEMINI_API_KEY}"
    )

    payload = json.dumps({
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "16:9",
            "personGeneration": "allow_adult",
            "safetyFilterLevel": "block_few",
        }
    }).encode()

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"  Calling Google Imagen 3 Fast (free)...")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            err = json.loads(body)
            print(f"  API error {e.code}: {err.get('error', {}).get('message', body[:200])}")
        except Exception:
            print(f"  HTTP {e.code}: {body[:200]}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

    predictions = result.get("predictions", [])
    if not predictions:
        print(f"  No image in response: {str(result)[:200]}")
        return None

    image_b64 = predictions[0].get("bytesBase64Encoded", "")
    if not image_b64:
        print(f"  Empty image data in response")
        return None

    image_bytes = base64.b64decode(image_b64)
    image_path = IMAGE_DIR / f"{slug}.jpg"
    image_path.write_bytes(image_bytes)
    print(f"  Saved: {image_path.name} ({len(image_bytes) // 1024}KB)")
    return f"/clinic-images/{slug}.jpg"


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def load_json(path: Path) -> dict:
    return json.loads(path.read_text()) if path.exists() else {}


def save_json(path: Path, data: dict):
    path.write_text(json.dumps(data, indent=2))


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    if not GEMINI_API_KEY:
        print("ERROR: Set your Gemini API key:")
        print("  export GEMINI_API_KEY='AIza...'")
        print("  python3 generate_clinic_images.py")
        sys.exit(1)

    clinics = json.loads(CLINICS_FILE.read_text())
    enriched = load_json(ENRICHED_FILE)
    images = load_json(IMAGES_FILE)
    log = load_json(LOG_FILE)

    completed_slugs = {e["slug"] for e in log.get("completed", [])}

    pending = [
        c for c in clinics
        if c["slug"] not in completed_slugs
        and c.get("website")
        and c["slug"] not in images
    ]

    if not pending:
        print("All clinics processed!")
        return

    clinic = pending[0]
    slug = clinic["slug"]
    city = clinic["city"]
    print(f"\nProcessing ({len(pending)} left): {clinic['name']} — {city}, {clinic['state']}")

    website_text = scrape_website(clinic.get("website", ""))
    print(f"  Scraped {len(website_text)} chars from website")

    enrichment = enriched.get(slug)
    prompt = build_image_prompt(clinic, enrichment, website_text)
    print(f"  Prompt: {prompt[:100]}...")

    image_path = generate_image(prompt, slug)
    if not image_path:
        print("  Failed — will retry next run")
        return

    images[slug] = {
        "path": image_path,
        "generatedAt": date.today().isoformat(),
        "prompt": prompt[:300],
    }
    save_json(IMAGES_FILE, images)

    log.setdefault("completed", []).append({
        "slug": slug,
        "name": clinic["name"],
        "date": date.today().isoformat(),
    })
    save_json(LOG_FILE, log)

    # Auto-commit and push
    os.system(f"""
        cd '{BASE}' && \
        git add iv-app/data/clinic_images.json iv-app/data/image_generation_log.json 'iv-app/public/clinic-images/{slug}.jpg' && \
        git commit -m "Add AI image: {clinic['name']} ({city})" && \
        git push origin main
    """)

    print(f"  Done! {len(log['completed'])}/273 complete.")


if __name__ == "__main__":
    main()
