import { describe, it, expect } from "vitest";
import {
  getAllClinics,
  getClinic,
  getAllSlugs,
  getTopClinics,
  getFeaturedCities,
  searchClinics,
} from "@/lib/data";

// ─── getAllClinics ───────────────────────────────────────────────────────────
describe("getAllClinics", () => {
  it("returns an array", () => {
    expect(Array.isArray(getAllClinics())).toBe(true);
  });

  it("returns at least 1 clinic", () => {
    expect(getAllClinics().length).toBeGreaterThan(0);
  });

  it("each clinic has required fields", () => {
    for (const clinic of getAllClinics()) {
      expect(clinic).toHaveProperty("id");
      expect(clinic).toHaveProperty("slug");
      expect(clinic).toHaveProperty("name");
      expect(clinic).toHaveProperty("city");
      expect(clinic).toHaveProperty("state");
    }
  });
});

// ─── getClinic ───────────────────────────────────────────────────────────────
describe("getClinic", () => {
  it("finds the first clinic by slug", () => {
    const all = getAllClinics();
    const first = all[0];
    const found = getClinic(first.slug);
    expect(found).toBeDefined();
    expect(found?.name).toBe(first.name);
  });

  it("returns undefined for a non-existent slug", () => {
    expect(getClinic("this-slug-does-not-exist-xyz")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    const all = getAllClinics();
    const slug = all[0].slug.toUpperCase();
    expect(getClinic(slug)).toBeUndefined();
  });
});

// ─── getAllSlugs ─────────────────────────────────────────────────────────────
describe("getAllSlugs", () => {
  it("returns same count as getAllClinics", () => {
    expect(getAllSlugs().length).toBe(getAllClinics().length);
  });

  it("each entry has a slug property", () => {
    for (const entry of getAllSlugs()) {
      expect(typeof entry.slug).toBe("string");
      expect(entry.slug.length).toBeGreaterThan(0);
    }
  });

  it("slugs are unique", () => {
    const slugs = getAllSlugs().map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });
});

// ─── getTopClinics ───────────────────────────────────────────────────────────
describe("getTopClinics", () => {
  it("returns at most the requested limit", () => {
    expect(getTopClinics(3).length).toBeLessThanOrEqual(3);
    expect(getTopClinics(6).length).toBeLessThanOrEqual(6);
  });

  it("all returned clinics have rating >= 4.5", () => {
    for (const clinic of getTopClinics(20)) {
      expect(clinic.rating).not.toBeNull();
      expect(clinic.rating!).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("all returned clinics have reviewCount >= 50", () => {
    for (const clinic of getTopClinics(20)) {
      expect(clinic.reviewCount).not.toBeNull();
      expect(clinic.reviewCount!).toBeGreaterThanOrEqual(50);
    }
  });

  it("results are sorted by rating descending", () => {
    const top = getTopClinics(10);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].rating!).toBeGreaterThanOrEqual(top[i].rating!);
    }
  });

  it("uses default limit of 6", () => {
    expect(getTopClinics().length).toBeLessThanOrEqual(6);
  });
});

// ─── getFeaturedCities ───────────────────────────────────────────────────────
describe("getFeaturedCities", () => {
  it("returns at most the requested limit", () => {
    expect(getFeaturedCities(5).length).toBeLessThanOrEqual(5);
  });

  it("uses default limit of 8", () => {
    expect(getFeaturedCities().length).toBeLessThanOrEqual(8);
  });

  it("each entry has city, state, and count", () => {
    for (const entry of getFeaturedCities()) {
      expect(typeof entry.city).toBe("string");
      expect(typeof entry.state).toBe("string");
      expect(typeof entry.count).toBe("number");
      expect(entry.count).toBeGreaterThan(0);
    }
  });

  it("is sorted by count descending", () => {
    const cities = getFeaturedCities(8);
    for (let i = 1; i < cities.length; i++) {
      expect(cities[i - 1].count).toBeGreaterThanOrEqual(cities[i].count);
    }
  });
});

// ─── searchClinics ───────────────────────────────────────────────────────────
describe("searchClinics", () => {
  it("returns all clinics (up to 100) with no params", () => {
    const results = searchClinics({});
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(100);
  });

  it("searches by city name (case-insensitive)", () => {
    const results = searchClinics({ q: "seattle" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      const matchesCityOrName =
        r.city.toLowerCase().includes("seattle") ||
        r.name.toLowerCase().includes("seattle");
      expect(matchesCityOrName).toBe(true);
    }
  });

  it("searches by city, state format", () => {
    const results = searchClinics({ q: "Seattle, WA" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.city.toLowerCase()).toContain("seattle");
      expect(r.state.toUpperCase()).toBe("WA");
    }
  });

  it("searches by zip code", () => {
    const allClinics = getAllClinics();
    const withZip = allClinics.find((c) => c.zip && c.zip.length === 5);
    if (withZip) {
      const results = searchClinics({ zip: withZip.zip });
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.zip).toContain(withZip.zip);
      }
    }
  });

  it("returns empty array for non-existent city", () => {
    const results = searchClinics({ q: "ZZZNonexistentCityXXX" });
    expect(results).toHaveLength(0);
  });

  it("filters by minimum rating", () => {
    const results = searchClinics({ rating: "4.5" });
    for (const r of results) {
      expect(r.rating).not.toBeNull();
      expect(r.rating!).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("sorts by review count when sort=reviews", () => {
    const results = searchClinics({ sort: "reviews" });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].reviewCount ?? 0).toBeGreaterThanOrEqual(results[i].reviewCount ?? 0);
    }
  });

  it("sorts alphabetically when sort=name", () => {
    const results = searchClinics({ sort: "name" });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].name.localeCompare(results[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it("never returns more than 100 results", () => {
    expect(searchClinics({}).length).toBeLessThanOrEqual(100);
  });

  it("combined filters: city + min rating", () => {
    const results = searchClinics({ q: "seattle", rating: "4" });
    for (const r of results) {
      const matchesCityOrName =
        r.city.toLowerCase().includes("seattle") ||
        r.name.toLowerCase().includes("seattle");
      expect(matchesCityOrName).toBe(true);
      expect(r.rating!).toBeGreaterThanOrEqual(4);
    }
  });
});
