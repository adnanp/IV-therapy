#!/usr/bin/env python3
"""
Clinic Image Generator — generates AI photos for clinic pages using
Pollinations.ai (completely free, no API key, no IP restrictions).

Runs automatically via GitHub Actions 5x/day.
"""

import json
import os
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

IMAGE_DIR.mkdir(exist_ok=True)


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
        f"Photorealistic DSLR photo, editorial healthcare photography. "
        f"No text overlays, no watermarks, no cartoon style, fully realistic."
    )


# ─── IMAGE GENERATION via Pollinations.ai (free, no key needed) ──────────────

def generate_image(prompt: str, slug: str) -> str | None:
    encoded = urllib.parse.quote(prompt)
    # Use slug as seed for consistency (same clinic always gets same image)
    seed = abs(hash(slug)) % 999999
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1200&height=800&seed={seed}&nologo=true&model=flux-realism"

    print(f"  Calling Pollinations.ai (free, no key)...")
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; IVDirectory/1.0)"}
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            image_bytes = resp.read()
    except Exception as e:
        print(f"  Error: {e}")
        return None

    if len(image_bytes) < 5000:
        print(f"  Response too small ({len(image_bytes)} bytes) — likely an error")
        return None

    image_path = IMAGE_DIR / f"{slug}.jpg"
    image_path.write_bytes(image_bytes)
    print(f"  Saved: {image_path.name} ({len(image_bytes) // 1024}KB)")
    return f"/clinic-images/{slug}.jpg"


# ─── HELPERS ──────────────────────────────────────────────────────────────────

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


def load_json(path: Path) -> dict:
    return json.loads(path.read_text()) if path.exists() else {}


def save_json(path: Path, data: dict):
    path.write_text(json.dumps(data, indent=2))


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    clinics = json.loads(CLINICS_FILE.read_text())
    enriched = load_json(ENRICHED_FILE)
    images = load_json(IMAGES_FILE)
    log = load_json(LOG_FILE)

    completed_slugs = {e["slug"] for e in log.get("completed", [])}

    pending = [
        c for c in clinics
        if c["slug"] not in completed_slugs
        and c["slug"] not in images
    ]

    if not pending:
        print("All clinics processed!")
        return

    # Process up to 5 clinics per run
    batch = pending[:5]
    print(f"{len(pending)} clinics remaining. Processing {len(batch)} this run...")

    for clinic in batch:
        slug = clinic["slug"]
        city = clinic["city"]
        print(f"\n  [{clinic['name']} — {city}, {clinic['state']}]")

        website_text = scrape_website(clinic.get("website", ""))
        enrichment = enriched.get(slug)
        prompt = build_image_prompt(clinic, enrichment, website_text)
        print(f"  Prompt: {prompt[:80]}...")

        image_path = generate_image(prompt, slug)
        if not image_path:
            print("  Failed — will retry next run")
            continue

        images[slug] = {
            "path": image_path,
            "generatedAt": date.today().isoformat(),
        }
        save_json(IMAGES_FILE, images)

        log.setdefault("completed", []).append({
            "slug": slug,
            "name": clinic["name"],
            "date": date.today().isoformat(),
        })
        save_json(LOG_FILE, log)

        print(f"  Done! {len(log['completed'])}/{len(clinics)} complete.")

    print(f"\nBatch complete. {len(pending) - len(batch)} clinics still pending.")


if __name__ == "__main__":
    main()
