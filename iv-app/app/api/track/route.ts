import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const CLICKS_FILE = join(process.cwd(), "data", "clicks.json");

interface ClickEvent {
  slug: string;
  type: "book" | "call" | "website";
  ts: number;
  date: string;
}

function loadClicks(): ClickEvent[] {
  if (!existsSync(CLICKS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(CLICKS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, type } = body;
    if (!slug || !type) return NextResponse.json({ ok: false }, { status: 400 });

    // Best-effort write — filesystem is read-only on serverless (Vercel).
    // Silently skip if write fails so the client always gets a 200.
    try {
      const clicks = loadClicks();
      clicks.push({ slug, type, ts: Date.now(), date: new Date().toISOString() });
      writeFileSync(CLICKS_FILE, JSON.stringify(clicks, null, 2));
    } catch {
      // Filesystem not writable (serverless) — skip silently
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Analytics summary endpoint
export async function GET() {
  const clicks = loadClicks();
  const summary: Record<string, { book: number; call: number; website: number; total: number }> = {};
  for (const click of clicks) {
    if (!summary[click.slug]) summary[click.slug] = { book: 0, call: 0, website: 0, total: 0 };
    summary[click.slug][click.type]++;
    summary[click.slug].total++;
  }
  const sorted = Object.entries(summary)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 50);
  return NextResponse.json({ total: clicks.length, topClinics: Object.fromEntries(sorted) });
}
