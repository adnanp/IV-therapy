import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// Each clinic gets a hash key: "clinic:{slug}:clicks"
// Fields: book, call, website (counters)

function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, type } = body;
    if (!slug || !type) return NextResponse.json({ ok: false }, { status: 400 });

    if (isKvAvailable()) {
      // Increment click counter in KV store
      await kv.hincrby(`clinic:${slug}:clicks`, type, 1);
      // Also track total click events with timestamp (capped at last 1000)
      await kv.lpush("click_events", JSON.stringify({ slug, type, ts: Date.now() }));
      await kv.ltrim("click_events", 0, 999);
    }
    // If KV not configured (local dev), silently succeed

    return NextResponse.json({ ok: true });
  } catch {
    // Never return an error to the client — tracking is non-critical
    return NextResponse.json({ ok: true });
  }
}

// Analytics summary — GET /api/track
export async function GET() {
  if (!isKvAvailable()) {
    return NextResponse.json({ error: "KV not configured" }, { status: 503 });
  }

  try {
    // Get all clinic click keys
    const keys = await kv.keys("clinic:*:clicks");

    const summary: Record<string, { book: number; call: number; website: number; total: number }> = {};

    for (const key of keys) {
      const slug = key.replace("clinic:", "").replace(":clicks", "");
      const data = await kv.hgetall<{ book?: string; call?: string; website?: string }>(key);
      if (data) {
        const book = parseInt(data.book ?? "0");
        const call = parseInt(data.call ?? "0");
        const website = parseInt(data.website ?? "0");
        summary[slug] = { book, call, website, total: book + call + website };
      }
    }

    const sorted = Object.entries(summary)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 50);

    const totalEvents = await kv.llen("click_events");

    return NextResponse.json({
      total: totalEvents,
      topClinics: Object.fromEntries(sorted),
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
