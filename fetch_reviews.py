#!/usr/bin/env python3
"""
Google Places API review collector for IV therapy clinics.

Usage:
  export GOOGLE_API_KEY="your_key_here"
  python3 fetch_reviews.py

Processes 1 clinic at a time, saves progress after each, safe to re-run.
Free tier: $200/month credit (~5,800 clinic lookups at $0.034/clinic).
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE = Path("/home/user/IV-therapy")
CLINICS_FILE = BASE / "iv-app/data/clinics.json"
REVIEWS_FILE = BASE / "iv-app/data/reviews.json"
PROGRESS_FILE = BASE / "iv-app/data/review_fetch_progress.json"

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
DELAY_BETWEEN_CLINICS = 2  # seconds — polite rate limiting


def api_get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "IVDirectory/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def find_place_id(clinic: dict) -> str | None:
    """Use Places Text Search to find the Place ID for a clinic."""
    query = f"{clinic['name']} {clinic['city']} {clinic['state']}"
    params = urllib.parse.urlencode({
        "query": query,
        "key": GOOGLE_API_KEY,
        "fields": "place_id,name",
    })
    url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={urllib.parse.quote(query)}&inputtype=textquery&fields=place_id,name&key={GOOGLE_API_KEY}"
    data = api_get(url)

    if data.get("status") != "OK":
        print(f"    [places search] status={data.get('status')} — {data.get('error_message','')}")
        return None

    candidates = data.get("candidates", [])
    if not candidates:
        return None

    return candidates[0].get("place_id")


def fetch_reviews(place_id: str) -> list:
    """Fetch up to 5 reviews for a given Place ID."""
    url = (
        f"https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={place_id}"
        f"&fields=reviews,rating,user_ratings_total"
        f"&key={GOOGLE_API_KEY}"
    )
    data = api_get(url)

    if data.get("status") != "OK":
        print(f"    [place details] status={data.get('status')} — {data.get('error_message','')}")
        return []

    raw_reviews = data.get("result", {}).get("reviews", [])
    reviews = []
    for r in raw_reviews:
        reviews.append({
            "authorName": r.get("author_name", "Anonymous"),
            "authorPhotoUrl": r.get("profile_photo_url", None),
            "rating": r.get("rating", 5),
            "text": r.get("text", ""),
            "time": r.get("time", 0),
            "relativeTimeDescription": r.get("relative_time_description", ""),
            "source": "google",
        })
    return reviews


def load_progress() -> set:
    if PROGRESS_FILE.exists():
        return set(json.loads(PROGRESS_FILE.read_text()).get("done", []))
    return set()


def save_progress(done: set):
    PROGRESS_FILE.write_text(json.dumps({"done": list(done)}, indent=2))


def main():
    if not GOOGLE_API_KEY:
        print("ERROR: GOOGLE_API_KEY environment variable not set.")
        print("  Get a key at: https://console.cloud.google.com/apis/credentials")
        print("  Enable: Places API")
        print("  Then run: export GOOGLE_API_KEY='your_key_here'")
        sys.exit(1)

    clinics = json.loads(CLINICS_FILE.read_text())
    reviews = json.loads(REVIEWS_FILE.read_text())
    done = load_progress()

    # Find clinics that still need reviews
    pending = [
        c for c in clinics
        if c["slug"] not in done and not reviews.get(c["slug"])
    ]

    print(f"Clinics needing reviews: {len(pending)}")
    print(f"Already processed: {len(done)}")
    print()

    if not pending:
        print("All clinics have reviews!")
        return

    for i, clinic in enumerate(pending):
        slug = clinic["slug"]
        print(f"[{i+1}/{len(pending)}] {clinic['name']} — {clinic['city']}, {clinic['state']}")

        try:
            place_id = find_place_id(clinic)
            if not place_id:
                print(f"    No Place ID found — skipping")
                done.add(slug)
                save_progress(done)
                time.sleep(DELAY_BETWEEN_CLINICS)
                continue

            print(f"    Place ID: {place_id}")
            clinic_reviews = fetch_reviews(place_id)
            print(f"    Found {len(clinic_reviews)} reviews")

            if clinic_reviews:
                reviews[slug] = clinic_reviews
                REVIEWS_FILE.write_text(json.dumps(reviews, indent=2))

            done.add(slug)
            save_progress(done)

        except Exception as e:
            print(f"    ERROR: {e}")
            # Don't mark as done — will retry next run

        time.sleep(DELAY_BETWEEN_CLINICS)

    print()
    print(f"Done. {len([s for s in reviews if reviews[s]])} clinics now have reviews.")


if __name__ == "__main__":
    main()
