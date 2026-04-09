import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "hello@ivdirectory.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "IVDirectory <noreply@ivdirectory.com>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const city = (body.city ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Send welcome email to subscriber
    await sendEmail(
      email,
      "Welcome to IVDirectory — You're on the list!",
      `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <div style="margin-bottom:24px">
          <span style="background:#0d9488;color:white;font-weight:700;font-size:14px;padding:6px 12px;border-radius:6px">IVDirectory</span>
        </div>
        <h1 style="font-size:22px;font-weight:800;margin-bottom:8px">You're on the list!</h1>
        <p style="color:#555;line-height:1.6;margin-bottom:16px">
          Thanks for subscribing${city ? ` — we'll keep an eye on IV therapy clinics in <strong>${city}</strong> for you` : ""}.
          We'll notify you when new clinics open near you, exclusive first-session discounts become available, or there's something worth knowing.
        </p>
        <p style="color:#555;line-height:1.6;margin-bottom:24px">
          In the meantime, browse our directory of 273+ verified IV therapy clinics:
        </p>
        <a href="https://ivdirectory.com/search" style="background:#0d9488;color:white;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;display:inline-block;font-size:14px">
          Browse Clinics →
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0" />
        <p style="color:#999;font-size:12px">
          IVDirectory · <a href="https://ivdirectory.com" style="color:#0d9488">ivdirectory.com</a><br/>
          You subscribed from the IVDirectory website. No spam, unsubscribe anytime.
        </p>
      </div>
      `
    );

    // Notify site owner of new subscriber
    await sendEmail(
      NOTIFY_EMAIL,
      `New subscriber: ${email}${city ? ` (${city})` : ""}`,
      `<p>New subscriber: <strong>${email}</strong>${city ? ` from <strong>${city}</strong>` : ""}</p>`
    );

    return NextResponse.json({ message: "You're on the list! Check your inbox." });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
