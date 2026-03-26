import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatPhone, formatRating, isOpenNow, getHoursDisplay, getPriceRange } from "@/lib/utils";

// ─── formatPhone ────────────────────────────────────────────────────────────
describe("formatPhone", () => {
  it("formats a +1 number correctly", () => {
    expect(formatPhone("+1 206-299-1102")).toBe("(206) 299-1102");
  });

  it("formats a number without +1 prefix", () => {
    expect(formatPhone("2063001234")).toBe("(206) 300-1234");
  });

  it("returns empty string for null", () => {
    expect(formatPhone(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatPhone(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatPhone("")).toBe("");
  });
});

// ─── formatRating ───────────────────────────────────────────────────────────
describe("formatRating", () => {
  it("formats a decimal rating to 1 decimal place", () => {
    expect(formatRating(4.8)).toBe("4.8");
  });

  it("formats a whole number to 1 decimal place", () => {
    expect(formatRating(5)).toBe("5.0");
  });

  it("returns N/A for null", () => {
    expect(formatRating(null)).toBe("N/A");
  });

  it("returns N/A for undefined", () => {
    expect(formatRating(undefined)).toBe("N/A");
  });

  it("handles 0 correctly", () => {
    expect(formatRating(0)).toBe("0.0");
  });
});

// ─── isOpenNow ──────────────────────────────────────────────────────────────
describe("isOpenNow", () => {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function makeHours(timeStr: string) {
    const today = DAYS[new Date().getDay()];
    return JSON.stringify({ [today]: [timeStr] });
  }

  it("returns null for null input", () => {
    expect(isOpenNow(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(isOpenNow(undefined)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(isOpenNow("not-json")).toBeNull();
  });

  it("returns true for open 24 hours", () => {
    expect(isOpenNow(makeHours("Open 24 hours"))).toBe(true);
  });

  it("returns false for closed today", () => {
    expect(isOpenNow(makeHours("Closed"))).toBe(false);
  });

  it("returns false when no hours for today", () => {
    expect(isOpenNow(JSON.stringify({ Monday: [] }))).toBe(false);
  });

  it("correctly detects open status based on current time", () => {
    // Create hours that span a wide range to reliably test
    const alwaysOpenHours = makeHours("1AM-11PM");
    const neverOpenHours = makeHours("2AM-3AM");
    const now = new Date();
    const hour = now.getHours();

    // 1AM–11PM = 60–1380 minutes
    const currentMin = hour * 60 + now.getMinutes();
    const expectOpen = currentMin >= 60 && currentMin < 1380;
    expect(isOpenNow(alwaysOpenHours)).toBe(expectOpen);
    // 2AM–3AM = 120–180 minutes
    const expectOpenNight = currentMin >= 120 && currentMin < 180;
    expect(isOpenNow(neverOpenHours)).toBe(expectOpenNight);
  });
});

// ─── getHoursDisplay ────────────────────────────────────────────────────────
describe("getHoursDisplay", () => {
  it("parses a valid hours JSON", () => {
    const hoursJson = JSON.stringify({ Monday: ["9AM-5PM"], Tuesday: ["10AM-6PM"] });
    const result = getHoursDisplay(hoursJson);
    expect(result).toEqual({ Monday: "9AM-5PM", Tuesday: "10AM-6PM" });
  });

  it("returns empty object for null", () => {
    expect(getHoursDisplay(null)).toEqual({});
  });

  it("returns empty object for invalid JSON", () => {
    expect(getHoursDisplay("bad json")).toEqual({});
  });

  it("joins multiple time slots with comma", () => {
    const hoursJson = JSON.stringify({ Monday: ["9AM-12PM", "1PM-5PM"] });
    const result = getHoursDisplay(hoursJson);
    expect(result.Monday).toBe("9AM-12PM, 1PM-5PM");
  });
});

// ─── getPriceRange ──────────────────────────────────────────────────────────
describe("getPriceRange", () => {
  it("returns $$$ for luxury categories", () => {
    expect(getPriceRange("luxury spa")).toBe("$$$");
    expect(getPriceRange("premium services")).toBe("$$$");
    expect(getPriceRange("concierge medicine")).toBe("$$$");
  });

  it("returns $ for mobile or affordable categories", () => {
    expect(getPriceRange("mobile iv therapy")).toBe("$");
    expect(getPriceRange("affordable wellness")).toBe("$");
  });

  it("returns $$ for general categories", () => {
    expect(getPriceRange("IV therapy service")).toBe("$$");
    expect(getPriceRange("Medical spa")).toBe("$$");
  });

  it("returns $$ for null", () => {
    expect(getPriceRange(null)).toBe("$$");
  });

  it("returns $$ for empty string", () => {
    expect(getPriceRange("")).toBe("$$");
  });
});
