#!/usr/bin/env node
/**
 * enrich-clinics-scraper.mjs
 *
 * Fetches each clinic's website and extracts structured "What to Expect"
 * data using pattern-matching — no API key required.
 *
 * Usage:
 *   node scripts/enrich-clinics-scraper.mjs            # top 50 by rating
 *   node scripts/enrich-clinics-scraper.mjs --all      # all clinics
 *   node scripts/enrich-clinics-scraper.mjs --force    # re-fetch already done
 *   node scripts/enrich-clinics-scraper.mjs --batch 2  # start at batch index 2
 *
 * Progress is saved after every clinic so you can Ctrl+C and resume.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");

const args = process.argv.slice(2);
const FETCH_ALL  = args.includes("--all");
const FORCE      = args.includes("--force");
const LIMIT      = FETCH_ALL ? Infinity : 50;
const DELAY_MS   = 800;   // polite delay between requests
const TIMEOUT_MS = 12000;

// ── helpers ──────────────────────────────────────────────────────────────────

function cleanUrl(raw) {
  return raw.replace(/%3F.*/i, "").replace(/%26.*/i, "").replace(/\?.*/, "");
}

async function fetchPage(url) {
  const res = await fetch(cleanUrl(url), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; IVDirectoryBot/1.0; +https://ivdirectory.com)",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // strip scripts/styles, collapse whitespace
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

// ── extraction patterns ───────────────────────────────────────────────────────

const DURATION_PATTERNS = [
  /(\d+)\s*[-–]\s*(\d+)\s*minutes?/i,
  /(\d+)\s*to\s*(\d+)\s*minutes?/i,
  /(\d+)\s*minutes?/i,
  /(\d+)\s*[-–]\s*(\d+)\s*hours?/i,
  /(\d+)\s*to\s*(\d+)\s*hours?/i,
  /about\s+(\d+)\s*(minutes?|hours?)/i,
  /approximately\s+(\d+)\s*(minutes?|hours?)/i,
  /as (little as|few as) (\d+)\s*minutes?/i,
  /under\s+(\d+)\s*minutes?/i,
  /less than\s+(\d+)\s*(minutes?|hours?)/i,
  /(30|45|60|90)\s*min/i,
  /drip\s+takes?\s+(\d+)/i,
  /session\s+(lasts?|takes?|is)\s+(\d+)/i,
  /(\d+)\s*hr/i,
  /NAD\+?\s+.{0,60}(\d+)\s*[-–]\s*(\d+)\s*hours?/i,
];

const PRICE_PATTERNS = [
  /\$\s*(\d{2,4})(?:\s*[-–]\s*\$?\s*(\d{2,4}))?/g,
  /starting\s+(?:at|from)\s+\$\s*(\d{2,4})/i,
  /from\s+\$\s*(\d{2,4})/i,
  /prices?\s+(?:start|begin|from)\s+(?:at\s+)?\$\s*(\d{2,4})/i,
  /(\d{2,4})\s*(?:per|\/)\s*(?:session|treatment|drip|infusion)/i,
  /packages?\s+(?:start|available|from)\s+\$?\s*(\d{2,4})/i,
];

const FREQUENCY_PATTERNS = [
  /(?:recommended?|suggest(?:ed)?|ideal(?:ly)?|typically?)\s+.{0,40}(?:once|twice|monthly|weekly|bi-?weekly|every \d+)/i,
  /once\s+(?:a|per)\s+(week|month|year)/i,
  /twice\s+(?:a|per)\s+(week|month)/i,
  /every\s+\d+\s+(?:days?|weeks?|months?)/i,
  /monthly\s+(?:drip|infusion|treatment|session)/i,
  /weekly\s+(?:drip|infusion|treatment|session)/i,
  /(\d+)\s*x\s*(?:per|a)\s*(week|month)/i,
];

const INCLUDED_KEYWORDS = [
  "health assessment", "intake form", "consultation", "health history",
  "nurse", "registered nurse", "RN", "medical professional", "physician",
  "IV placement", "IV insertion", "catheter", "blood pressure", "vital",
  "monitoring", "post-treatment", "aftercare",
];

const FIRST_VISIT_PATTERNS = [
  /first\s+(?:time|visit|appointment|session)\s+.{10,200}[.!]/i,
  /new\s+(?:patients?|clients?)\s+.{10,200}[.!]/i,
  /arrive\s+\d+\s*(?:minutes?|min)\s+early/i,
  /book\s+(?:online|your appointment|now)\s+.{0,100}[.!]/i,
  /(?:complete|fill out)\s+(?:an?\s+)?intake/i,
  /no\s+(?:appointment|referral|prescription)\s+(?:needed|required|necessary)/i,
  /walk[\s-]ins?\s+(?:welcome|accepted?)/i,
  /schedule\s+(?:online|your)/i,
];

const NON_IV_SIGNALS = [
  /physical\s+therapy(?!\s+and)/i,
  /ketamine\s+(?:infusion|treatment|therapy|clinic)(?!\s+and\s+iv)/i,
  /hair\s+(salon|lounge|studio|care)/i,
  /dental|dentist|orthodont/i,
  /chiropractic|chiropractor/i,
  /mental\s+health\s+(?:therapy|counseling)/i,
  /marriage\s+(and|&)\s+family\s+therap/i,
  /home\s+infusion\s+pharmacy/i,
  /specialty\s+pharmacy/i,
  /sleep\s+(center|clinic|study|apnea)(?!\s+and)/i,
  /addiction\s+(?:recovery|treatment|rehab)/i,
  /optometry|optometrist|eye\s+care/i,
  /podiatr/i,
];

const IV_SIGNALS = [
  /iv\s+(therapy|drip|infusion|treatment|hydration|lounge|bar)/i,
  /intravenous/i,
  /infusion\s+(therapy|treatment|service)/i,
  /vitamin\s+(drip|iv|infusion)/i,
  /myers\s+cocktail/i,
  /nad\+?(\s+therapy|\s+infusion|\s+iv)?/i,
  /glutathione/i,
  /hydration\s+(therapy|drip|iv|infusion)/i,
  /iv\s+(bag|line|catheter)/i,
  /drip\s+(bar|lounge|therapy|hydration)/i,
];

// ── extraction logic ──────────────────────────────────────────────────────────

function extract(text, name) {
  const t = text;

  // 1. Does it offer IV therapy?
  const hasIVSignal    = IV_SIGNALS.some(p => p.test(t));
  const hasNonIVSignal = NON_IV_SIGNALS.some(p => p.test(t));

  // For clearly non-IV clinics (no IV signal at all + strong non-IV signal)
  const offersIV = hasIVSignal || (!hasNonIVSignal);
  let removalReason = null;

  if (!hasIVSignal && hasNonIVSignal) {
    const signal = NON_IV_SIGNALS.find(p => p.test(t));
    removalReason = signal ? signal.source.replace(/[\\/^$]/g, "").split("\\")[0].trim() : "no IV therapy content found";
  }

  // 2. Session duration
  let sessionDuration = null;
  for (const pat of DURATION_PATTERNS) {
    const m = t.match(pat);
    if (m) {
      // grab context around the match (up to 80 chars)
      const idx = t.search(pat);
      const snippet = t.slice(Math.max(0, idx - 20), idx + 80).trim();
      // clean it up
      sessionDuration = snippet.replace(/\s+/g, " ").slice(0, 100);
      break;
    }
  }

  // 3. Pricing
  let priceNote = null;
  const priceMatches = [...t.matchAll(/\$\s*(\d{2,4})(?:\s*[-–\/]\s*\$?\s*(\d{2,4}))?/g)];
  const ivPriceContext = priceMatches.filter(m => {
    const before = t.slice(Math.max(0, m.index - 80), m.index).toLowerCase();
    const after  = t.slice(m.index, m.index + 80).toLowerCase();
    return before.match(/iv|drip|infusion|hydrat|vitamin|myers|nad|glutathione|session|treatment/) ||
           after.match(/iv|drip|infusion|hydrat|vitamin|myers|nad|glutathione|session|treatment/);
  });
  if (ivPriceContext.length > 0) {
    const prices = [...new Set(ivPriceContext.map(m => "$" + m[1] + (m[2] ? "–$" + m[2] : "")))];
    if (prices.length === 1) {
      priceNote = prices[0] + " per session";
    } else if (prices.length <= 4) {
      priceNote = "Starting at " + prices[0] + "; range " + prices[0] + "–" + prices[prices.length - 1];
    } else {
      const nums = ivPriceContext.map(m => parseInt(m[1])).sort((a,b) => a-b);
      priceNote = `Starting at $${nums[0]}`;
    }
  } else {
    // Fallback: look for general starting-price language
    const fallback = t.match(/starting\s+(?:at|from)\s+\$\s*(\d{2,4})/i) ||
                     t.match(/from\s+\$\s*(\d{2,4})/i);
    if (fallback) priceNote = `Starting at $${fallback[1]}`;
  }

  // 4. What's included
  let whatIsIncluded = null;
  const includedFound = INCLUDED_KEYWORDS.filter(kw => t.toLowerCase().includes(kw.toLowerCase()));
  if (includedFound.length >= 2) {
    // Find the richest sentence mentioning these keywords
    const sentences = t.split(/[.!?]/).filter(s => s.length > 30 && s.length < 300);
    const best = sentences
      .filter(s => includedFound.some(kw => s.toLowerCase().includes(kw.toLowerCase())))
      .sort((a, b) => {
        const scoreA = includedFound.filter(kw => a.toLowerCase().includes(kw.toLowerCase())).length;
        const scoreB = includedFound.filter(kw => b.toLowerCase().includes(kw.toLowerCase())).length;
        return scoreB - scoreA;
      })[0];
    if (best) whatIsIncluded = best.trim().slice(0, 200);
  }

  // 5. First visit info
  let firstVisitInfo = null;
  for (const pat of FIRST_VISIT_PATTERNS) {
    const m = t.match(pat);
    if (m) {
      const idx = t.search(pat);
      firstVisitInfo = t.slice(Math.max(0, idx - 10), idx + 150).replace(/\s+/g, " ").trim().slice(0, 180);
      break;
    }
  }

  // 6. Frequency
  let frequency = null;
  for (const pat of FREQUENCY_PATTERNS) {
    const m = t.match(pat);
    if (m) {
      const idx = t.search(pat);
      frequency = t.slice(Math.max(0, idx - 10), idx + 120).replace(/\s+/g, " ").trim().slice(0, 150);
      break;
    }
  }

  // 7. Specialties — scan for named drip/treatment names
  const specialtyPatterns = [
    /myers\s+cocktail/gi,
    /NAD\+?(?:\s+(?:therapy|infusion|iv))?/gi,
    /glutathione/gi,
    /vitamin\s+c(?:\s+(?:iv|infusion|drip))?/gi,
    /immunity\s+(?:boost|iv|drip|infusion)/gi,
    /recovery\s+(?:iv|drip|infusion)/gi,
    /hydration\s+(?:iv|drip|infusion|therapy)/gi,
    /energy\s+(?:boost|iv|drip)/gi,
    /hangover\s+(?:cure|iv|drip|remedy|relief)/gi,
    /beauty\s+(?:iv|drip|infusion)/gi,
    /weight\s+loss\s+(?:iv|drip|infusion)/gi,
    /athletic\s+(?:performance|recovery)\s+(?:iv|drip)/gi,
    /b12\s+(?:injection|shot|iv)?/gi,
    /magnesium/gi,
    /zinc/gi,
    /biotin/gi,
    /amino\s+acid/gi,
    /anti[\s-]aging/gi,
    /mitochondrial/gi,
    /high[\s-]dose\s+vitamin\s+c/gi,
    /immune\s+support/gi,
    /jet\s+lag/gi,
    /migraine\s+(?:relief|iv|drip)/gi,
    /tri[\s-]immune/gi,
  ];

  const specialties = [];
  for (const pat of specialtyPatterns) {
    const matches = t.match(pat);
    if (matches) {
      const cleaned = matches[0].replace(/\s+/g, " ").trim();
      if (!specialties.some(s => s.toLowerCase() === cleaned.toLowerCase())) {
        specialties.push(cleaned.slice(0, 50));
      }
    }
  }

  return {
    offersIV,
    removalReason,
    sessionDuration,
    whatIsIncluded,
    firstVisitInfo,
    frequency,
    specialties: specialties.slice(0, 8),
    priceNote,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────

const clinics = JSON.parse(readFileSync(join(DATA_DIR, "clinics.json"), "utf8"));
let enriched = {};
try {
  enriched = JSON.parse(readFileSync(join(DATA_DIR, "enriched.json"), "utf8"));
} catch { /* start fresh */ }

const withSites = clinics
  .filter(c => c.website && c.website.startsWith("http"))
  .sort((a, b) => (b.rating ?? 0) * (b.reviewCount ?? 0) - (a.rating ?? 0) * (a.reviewCount ?? 0));

const targets = withSites.filter(c => FORCE || !enriched[c.slug]).slice(0, LIMIT);

if (targets.length === 0) {
  console.log("✅ All clinics already enriched. Use --force to re-fetch.");
  process.exit(0);
}

console.log(`Processing ${targets.length} clinics (${withSites.length - targets.length} already done)…\n`);

const toRemove = [];
let processed = 0;
let enrichedCount = 0;
let skippedNonIV = 0;
let errors = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

for (const clinic of targets) {
  const { slug, name, website } = clinic;
  process.stdout.write(`  [${processed + 1}/${targets.length}] ${name.slice(0, 45).padEnd(45)} … `);

  try {
    const pageText = await fetchPage(website);
    const result = extract(pageText, name);

    if (!result.offersIV) {
      process.stdout.write(`❌  NOT IV THERAPY (${result.removalReason ?? "no IV signals found"})\n`);
      toRemove.push({ slug, name, reason: result.removalReason });
      skippedNonIV++;
      // Still store minimal entry so we don't re-check it
      enriched[slug] = {
        sessionDuration: null, whatIsIncluded: null, firstVisitInfo: null,
        frequency: null, specialties: [], priceNote: null, _notIV: true,
      };
    } else {
      enriched[slug] = {
        sessionDuration: result.sessionDuration,
        whatIsIncluded: result.whatIsIncluded,
        firstVisitInfo: result.firstVisitInfo,
        frequency: result.frequency,
        specialties: result.specialties,
        priceNote: result.priceNote,
      };
      enrichedCount++;
      const hasData = Object.values(enriched[slug]).some(v => v && (Array.isArray(v) ? v.length > 0 : true));
      process.stdout.write(hasData ? "✓\n" : "⚠ (no data extracted)\n");
    }

    // Save after every clinic so progress is never lost
    writeFileSync(join(DATA_DIR, "enriched.json"), JSON.stringify(enriched, null, 2));
  } catch (err) {
    process.stdout.write(`⚠ ERROR: ${err.message}\n`);
    errors++;
    enriched[slug] = {
      sessionDuration: null, whatIsIncluded: null, firstVisitInfo: null,
      frequency: null, specialties: [], priceNote: null,
    };
    writeFileSync(join(DATA_DIR, "enriched.json"), JSON.stringify(enriched, null, 2));
  }

  processed++;
  await sleep(DELAY_MS);
}

// ── Remove non-IV clinics from clinics.json ───────────────────────────────────
if (toRemove.length > 0) {
  console.log(`\n⚠  Removing ${toRemove.length} non-IV-therapy listings:`);
  toRemove.forEach(c => console.log(`   - ${c.name} (${c.reason})`));

  const slugsToRemove = new Set(toRemove.map(c => c.slug));
  // Also clean out their enriched entries
  for (const slug of slugsToRemove) delete enriched[slug];

  const updatedClinics = clinics.filter(c => !slugsToRemove.has(c.slug));
  writeFileSync(join(DATA_DIR, "clinics.json"), JSON.stringify(updatedClinics, null, 2));
  writeFileSync(join(DATA_DIR, "enriched.json"), JSON.stringify(enriched, null, 2));
  console.log(`   clinics.json updated: ${clinics.length} → ${updatedClinics.length} entries`);
}

console.log("\n─────────────────────────────────────────────────────");
console.log(`Processed        : ${processed}`);
console.log(`Enriched         : ${enrichedCount}`);
console.log(`Removed (non-IV) : ${skippedNonIV}`);
console.log(`Errors/unreachable: ${errors}`);
console.log(`Output           : data/enriched.json`);
console.log("─────────────────────────────────────────────────────");
