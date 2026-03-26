import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/^\+1\s?/, "").replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return "N/A";
  return rating.toFixed(1);
}

export function isOpenNow(hoursJson: string | null | undefined): boolean | null {
  if (!hoursJson) return null;
  try {
    const hours = JSON.parse(hoursJson) as Record<string, string[]>;
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[now.getDay()];
    const dayHours = hours[dayName];
    if (!dayHours || dayHours.length === 0) return false;

    const timeStr = dayHours[0];
    if (timeStr.toLowerCase() === "open 24 hours") return true;
    if (timeStr.toLowerCase().includes("closed")) return false;

    const match = timeStr.match(/^(\d+(?::\d+)?(?:AM|PM)?)\s*[-–]\s*(\d+(?::\d+)?(?:AM|PM)?)$/i);
    if (!match) return null;

    const parseTime = (t: string): number => {
      const isPM = /pm/i.test(t);
      const isAM = /am/i.test(t);
      const clean = t.replace(/[apm]/gi, "").trim();
      const [h, m = "0"] = clean.split(":");
      let hour = parseInt(h);
      if (isPM && hour !== 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      return hour * 60 + parseInt(m);
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const open = parseTime(match[1]);
    const close = parseTime(match[2]);
    return currentMinutes >= open && currentMinutes < close;
  } catch {
    return null;
  }
}

export function getHoursDisplay(hoursJson: string | null | undefined): Record<string, string> {
  if (!hoursJson) return {};
  try {
    const hours = JSON.parse(hoursJson) as Record<string, string[]>;
    const result: Record<string, string> = {};
    for (const [day, times] of Object.entries(hours)) {
      result[day] = Array.isArray(times) ? times.join(", ") : String(times);
    }
    return result;
  } catch {
    return {};
  }
}

export function getPriceRange(categories: string | null | undefined): string {
  if (!categories) return "$$";
  const lower = categories.toLowerCase();
  if (lower.includes("luxury") || lower.includes("premium") || lower.includes("concierge")) return "$$$";
  if (lower.includes("mobile") || lower.includes("affordable")) return "$";
  return "$$";
}
