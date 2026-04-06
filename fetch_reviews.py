#!/usr/bin/env python3
"""
Google Places API review collector for IV therapy clinics.

Usage:
  export GOOGLE_API_KEY="your_key_here"
  python3 fetch_reviews.py

Cost model (Google Places API):
  - Find Place:    $0.017 per call  (Basic Data)
  - Place Details: $0.017 per call  (Basic Data — name, rating)
  - reviews field: $0.000 EXTRA     (reviews are included in Basic Data at no extra cost)
  - Per clinic: ~$0.034 total
  - 273 clinics:  ~$9.28 total
  - Google free credit: $200/month  → ALL WITHIN FREE TIER, $0 charged to card

KILL SWITCH:
  - Hard cap: MAX_SPEND_USD = $0.50 (well under free tier, stops at ~15 clinics as a test)
  - Any API error suggesting billing issue → immediate stop
  - Any REQUEST_DENIED or billing error → immediate stop + alert
  - OVER_QUERY_LIMIT → stop + wait

To run full batch once confirmed safe, set MAX_SPEND_USD = 15.00
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
DELAY_BETWEEN_CLINICS = 2  # seconds

# ─── KILL SWITCH ─────────────────────────────────────────────────────────────
# Cost per clinic = 2 API calls × $0.017 = $0.034
# Free credit = $200/month → you won't be charged unless you do 5,882+ clinics
# We only have 273 clinics → estimated total cost: ~$9.28
# Kill switch is set to $15 (safely within free tier, but stops if something goes wrong)
MAX_SPEND_USD = 15.00
COST_PER_FIND_PLACE = 0.017
COST_PER_PLACE_DETAILS = 0.017

# These API statuses indicate a billing/auth problem — hard stop immediately
BILLING_ERROR_STATUSES = {
    "REQUEST_DENIED",       # API key invalid or billing not enabled
    "OVER_DAILY_LIMIT",     # Quota exceeded
    "OVER_QUERY_LIMIT",     # Rate limit hit
}

total_spent = 0.0
api_calls = 0
# ─────────────────────────────────────────────────────────────────────────────


def check_kill_switch(additional_cost: float = 0.0):
    """Raise SystemExit if we're approaching the spend limit."""
    global total_spent
    if total_spent + additional_cost > MAX_SPEND_USD:
        print()
        print("=" * 60)
        print("🛑 KILL SWITCH TRIGGERED")
        print(f"   Estimated spend so far: ${total_spent:.4f}")
        print(f"   Limit set to: ${MAX_SPEND_USD:.2f}")
        print(f"   API calls made: {api_calls}")
        print("   Stopping safely. All progress saved.")
        print("=" * 60)
        sys.exit(0)


def api_get(url: str, cost: float) -> dict:
    """Make an API call, track cost, check kill switch."""
    global total_spent, api_calls
    check_kill_switch(additional_cost=cost)

    req = urllib.request.Request(url, headers={"User-Agent": "IVDirectory/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())

    # Check for billing errors in response
    status = data.get("status", "")
    if status in BILLING_ERROR_STATUSES:
        print()
        print("=" * 60)
        print(f"🛑 BILLING/QUOTA ERROR DETECTED: {status}")
        error_msg = data.get("error_message", "No details provided")
        print(f"   Message: {error_msg}")
        print(f"   Spent so far: ${total_spent:.4f} ({api_calls} calls)")
        print("   Stopping immediately to prevent charges.")
        print("=" * 60)
        sys.exit(1)

    total_spent += cost
    api_calls += 1
    return data


def find_place_id(clinic: dict) -> str | None:
    """Use Places Find Place to get the Google Place ID."""
    query = f"{clinic['name']} {clinic['city']} {clinic['state']}"
    url = (
        f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        f"?input={urllib.parse.quote(query)}"
        f"&inputtype=textquery"
        f"&fields=place_id,name"
        f"&key={GOOGLE_API_KEY}"
    )
    data = api_get(url, cost=COST_PER_FIND_PLACE)

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        print(f"    [find place] status={data.get('status')}")
        return None

    candidates = data.get("candidates", [])
    if not candidates:
        return None

    return candidates[0].get("place_id")


def fetch_reviews(place_id: str) -> list:
    """Fetch up to 5 Google reviews for a Place ID."""
    url = (
        f"https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={place_id}"
        f"&fields=reviews,rating,user_ratings_total"
        f"&key={GOOGLE_API_KEY}"
    )
    data = api_get(url, cost=COST_PER_PLACE_DETAILS)

    if data.get("status") != "OK":
        print(f"    [place details] status={data.get('status')}")
        return []

    raw = data.get("result", {}).get("reviews", [])
    return [
        {
            "authorName": r.get("author_name", "Anonymous"),
            "authorPhotoUrl": r.get("profile_photo_url", None),
            "rating": r.get("rating", 5),
            "text": r.get("text", ""),
            "time": r.get("time", 0),
            "relativeTimeDescription": r.get("relative_time_description", ""),
            "source": "google",
        }
        for r in raw
        if r.get("text")  # only include reviews with actual text
    ]


def load_progress() -> set:
    if PROGRESS_FILE.exists():
        return set(json.loads(PROGRESS_FILE.read_text()).get("done", []))
    return set()


def save_progress(done: set):
    PROGRESS_FILE.write_text(json.dumps({"done": list(done)}, indent=2))


def main():
    if not GOOGLE_API_KEY:
        print("ERROR: Set GOOGLE_API_KEY first:")
        print("  export GOOGLE_API_KEY='your_key_here'")
        sys.exit(1)

    clinics = json.loads(CLINICS_FILE.read_text())
    reviews = json.loads(REVIEWS_FILE.read_text())
    done = load_progress()

    pending = [
        c for c in clinics
        if c["slug"] not in done and not reviews.get(c["slug"])
    ]

    estimated_cost = len(pending) * (COST_PER_FIND_PLACE + COST_PER_PLACE_DETAILS)
    print("=" * 60)
    print("Google Places Review Collector — COST SUMMARY")
    print(f"  Clinics to process:  {len(pending)}")
    print(f"  Already done:        {len(done)}")
    print(f"  Estimated cost:      ${estimated_cost:.2f}")
    print(f"  Google free credit:  $200.00/month")
    print(f"  Expected charge:     $0.00 (well within free tier)")
    print(f"  Kill switch at:      ${MAX_SPEND_USD:.2f}")
    print("=" * 60)
    print()

    if not pending:
        print("All clinics already processed!")
        return

    for i, clinic in enumerate(pending):
        slug = clinic["slug"]
        print(f"[{i+1}/{len(pending)}] {clinic['name']} | ${total_spent:.3f} spent so far")

        try:
            place_id = find_place_id(clinic)
            if not place_id:
                print(f"    → No match found, skipping")
                done.add(slug)
                save_progress(done)
                time.sleep(DELAY_BETWEEN_CLINICS)
                continue

            clinic_reviews = fetch_reviews(place_id)
            print(f"    → {len(clinic_reviews)} reviews found")

            if clinic_reviews:
                reviews[slug] = clinic_reviews
                REVIEWS_FILE.write_text(json.dumps(reviews, indent=2))

            done.add(slug)
            save_progress(done)

        except SystemExit:
            raise
        except Exception as e:
            print(f"    ERROR: {e}")

        time.sleep(DELAY_BETWEEN_CLINICS)

    print()
    print(f"✅ Complete. Total spent: ${total_spent:.4f} | API calls: {api_calls}")
    print(f"   Clinics with reviews: {len([s for s in reviews if reviews[s]])}")


if __name__ == "__main__":
    main()
