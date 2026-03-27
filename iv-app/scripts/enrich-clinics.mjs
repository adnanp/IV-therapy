#!/usr/bin/env node
/**
 * Enriches clinic detail pages by scraping each clinic's website for
 * session duration, inclusions, first-visit info, frequency, specialties, and pricing.
 *
 * Uses the Anthropic API to extract structured info from the fetched HTML.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/enrich-clinics.mjs           # top 20 clinics
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/enrich-clinics.mjs --all     # all clinics
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/enrich-clinics.mjs --force   # re-fetch existing
 *
 * Requires Node 18+. The Anthropic SDK must be installed:
 *   npm install @anthropic-ai/sdk (in root package.json or globally)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const FETCH_ALL = args.has("--all");
const FORCE = args.has("--force");
const BOOTSTRAP_LIMIT = 20;
const DELAY_MS = 500;

const clinics = JSON.parse(readFileSync(join(DATA_DIR, "clinics.json"), "utf8"));
let enriched = {};
try {
  enriched = JSON.parse(readFileSync(join(DATA_DIR, "enriched.json"), "utf8"));
} catch {
  // start fresh
}

// Sort by (rating × reviewCount) to prioritise top clinics first
const withSites = clinics
  .filter((c) => c.website && c.website.startsWith("http") && c.rating != null)
  .sort((a, b) => b.rating * (b.reviewCount ?? 0) - a.rating * (a.reviewCount ?? 0));

const targets = FETCH_ALL ? withSites : withSites.slice(0, BOOTSTRAP_LIMIT);

const EXTRACTION_PROMPT = `
You are extracting structured data from an IV therapy clinic website.
Return ONLY a JSON object with these fields (use null if the info is not on the page):
{
  "sessionDuration": "exact text about how long a session takes",
  "whatIsIncluded": "what is included in a typical session (assessment, placement, monitoring, etc.)",
  "firstVisitInfo": "what new patients should know / do before their first visit",
  "frequency": "how often treatments are recommended",
  "specialties": ["list", "of", "signature", "or", "specialty", "treatments"],
  "priceNote": "pricing information if available"
}
Only include real information from the page. Do not invent details.
`.trim();

async function fetchPage(url) {
  const cleanUrl = url.replace(/%3F.*/, "").replace(/\?.*/, "");
  const res = await fetch(cleanUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; IVDirectoryBot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // Strip HTML tags and collapse whitespace — keep first 8000 chars
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

async function extractWithClaude(pageText, clinicName) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nClinic: ${clinicName}\n\nPage content:\n${pageText}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

let processed = 0;
let enrichedCount = 0;
let skipped = 0;

for (const clinic of targets) {
  const { slug, name, website } = clinic;

  if (!FORCE && enriched[slug]) {
    skipped++;
    continue;
  }

  process.stdout.write(`  [${processed + 1}/${targets.length}] ${name} ... `);

  try {
    const pageText = await fetchPage(website);
    const result = await extractWithClaude(pageText, name);
    if (result) {
      enriched[slug] = {
        sessionDuration: result.sessionDuration ?? null,
        whatIsIncluded: result.whatIsIncluded ?? null,
        firstVisitInfo: result.firstVisitInfo ?? null,
        frequency: result.frequency ?? null,
        specialties: Array.isArray(result.specialties) ? result.specialties : [],
        priceNote: result.priceNote ?? null,
      };
      enrichedCount++;
      console.log("✓");
    } else {
      console.log("no structured data found");
      enriched[slug] = { sessionDuration: null, whatIsIncluded: null, firstVisitInfo: null, frequency: null, specialties: [], priceNote: null };
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    enriched[slug] = { sessionDuration: null, whatIsIncluded: null, firstVisitInfo: null, frequency: null, specialties: [], priceNote: null };
  }

  processed++;
  await sleep(DELAY_MS);
}

writeFileSync(join(DATA_DIR, "enriched.json"), JSON.stringify(enriched, null, 2));

console.log("\n─────────────────────────────────────────");
console.log(`Clinics processed : ${processed}`);
console.log(`Successfully enriched : ${enrichedCount}`);
console.log(`Skipped (already done): ${skipped}`);
console.log(`Output written to : data/enriched.json`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
