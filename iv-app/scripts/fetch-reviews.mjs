#!/usr/bin/env node
/**
 * Fetches Google Places reviews for IV therapy clinics and writes to data/reviews.json.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=AIza... node scripts/fetch-reviews.mjs           # top 10 clinics
 *   GOOGLE_PLACES_API_KEY=AIza... node scripts/fetch-reviews.mjs --all     # all 317 clinics
 *   GOOGLE_PLACES_API_KEY=AIza... node scripts/fetch-reviews.mjs --force   # re-fetch existing
 *
 * Requires Node 18+ (uses built-in fetch).
 * Reads:  data/clinics.json
 * Writes: data/reviews.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Error: GOOGLE_PLACES_API_KEY environment variable is not set.");
  console.error("Usage: GOOGLE_PLACES_API_KEY=AIza... node scripts/fetch-reviews.mjs");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const FETCH_ALL = args.has("--all");
const FORCE = args.has("--force");
const BOOTSTRAP_LIMIT = 10;
const DELAY_MS = 300; // stay well under rate limits

// ── Load data ────────────────────────────────────────────────────────────────

const clinics = JSON.parse(readFileSync(join(DATA_DIR, "clinics.json"), "utf8"));
let reviews = {};
try {
  reviews = JSON.parse(readFileSync(join(DATA_DIR, "reviews.json"), "utf8"));
} catch {
  // file doesn't exist yet — start fresh
}

// ── Sort clinics by (rating × reviewCount) desc for bootstrap priority ───────

const sorted = [...clinics]
  .filter((c) => c.rating != null && c.reviewCount != null)
  .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount);

const targets = FETCH_ALL ? sorted : sorted.slice(0, BOOTSTRAP_LIMIT);

// ── Google Places API (New) helpers ──────────────────────────────────────────

const PLACES_BASE = "https://places.googleapis.com/v1";

async function findPlaceId(name, city, state) {
  const textQuery = `${name} ${city} ${state}`;
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery, maxResultCount: 1 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Text Search failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.places?.[0]?.id ?? null;
}

async function fetchPlaceReviews(placeId) {
  const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "id,reviews",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Place Details failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return { placeId: data.id, rawReviews: data.reviews ?? [] };
}

function mapReview(raw, placeId) {
  return {
    authorName: raw.authorAttribution?.displayName ?? "Anonymous",
    authorPhotoUrl: raw.authorAttribution?.photoUri ?? null,
    rating: raw.rating ?? 5,
    text: raw.text?.text ?? raw.originalText?.text ?? "",
    time: raw.publishTime ? Math.floor(new Date(raw.publishTime).getTime() / 1000) : 0,
    relativeTimeDescription: raw.relativePublishTimeDescription ?? "",
    source: "google",
    placeId,
  };
}

// ── Main loop ─────────────────────────────────────────────────────────────────

let processed = 0;
let fetched = 0;
let skipped = 0;

for (const clinic of targets) {
  const { slug, name, city, state } = clinic;

  // Skip if already has reviews and --force not set
  if (!FORCE && reviews[slug] && reviews[slug].length > 0) {
    skipped++;
    continue;
  }

  process.stdout.write(`  [${processed + 1}/${targets.length}] ${name}, ${city} ${state} ... `);

  try {
    const placeId = await findPlaceId(name, city, state);
    if (!placeId) {
      console.log("no place found");
      reviews[slug] = [];
      processed++;
      await sleep(DELAY_MS);
      continue;
    }

    const { placeId: resolvedId, rawReviews } = await fetchPlaceReviews(placeId);

    // Keep English reviews only, up to 5
    const mapped = rawReviews
      .filter((r) => !r.text?.languageCode || r.text.languageCode.startsWith("en"))
      .slice(0, 5)
      .map((r) => mapReview(r, resolvedId));

    reviews[slug] = mapped;
    fetched += mapped.length;
    console.log(`${mapped.length} review(s)`);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    reviews[slug] = [];
  }

  processed++;
  await sleep(DELAY_MS);
}

// ── Write output ──────────────────────────────────────────────────────────────

writeFileSync(join(DATA_DIR, "reviews.json"), JSON.stringify(reviews, null, 2));

console.log("\n─────────────────────────────────────────");
console.log(`Clinics processed : ${processed}`);
console.log(`Reviews fetched   : ${fetched}`);
console.log(`Clinics skipped   : ${skipped} (already had reviews)`);
console.log(`Output written to : data/reviews.json`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
