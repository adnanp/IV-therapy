import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const SUBSCRIBERS_FILE = join(process.cwd(), "data", "subscribers.json");

function loadSubscribers(): string[] {
  if (!existsSync(SUBSCRIBERS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SUBSCRIBERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveSubscribers(emails: string[]) {
  writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(emails, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const subscribers = loadSubscribers();
    if (subscribers.includes(email)) {
      return NextResponse.json({ message: "Already subscribed!" });
    }

    subscribers.push(email);
    saveSubscribers(subscribers);

    return NextResponse.json({ message: "Subscribed successfully!" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
