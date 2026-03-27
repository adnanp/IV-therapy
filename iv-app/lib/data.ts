import clinicsData from "@/data/clinics.json";
import reviewsData from "@/data/reviews.json";
import enrichedData from "@/data/enriched.json";

export interface Clinic {
  id: number;
  slug: string;
  name: string;
  streetAddress: string | null;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  rating: number | null;
  reviewCount: number | null;
  categories: string | null;
  priceRange: string | null;
  description: string | null;
}

export interface Review {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  time: number;
  relativeTimeDescription: string;
  source: "google" | "trustpilot";
  placeId: string;
}

export interface ClinicEnrichment {
  sessionDuration: string | null;
  whatIsIncluded: string | null;
  firstVisitInfo: string | null;
  frequency: string | null;
  specialties: string[];
  priceNote: string | null;
}

const clinics: Clinic[] = clinicsData as Clinic[];
const reviews = reviewsData as Record<string, Review[]>;
const enriched = enrichedData as Record<string, ClinicEnrichment>;

export function getEnrichment(slug: string): ClinicEnrichment | null {
  return enriched[slug] ?? null;
}

export function getReviews(slug: string): Review[] {
  return reviews[slug] ?? [];
}

export function getAllClinics(): Clinic[] {
  return clinics;
}

export function getClinic(slug: string): Clinic | undefined {
  return clinics.find((c) => c.slug === slug);
}

export function getAllSlugs(): { slug: string }[] {
  return clinics.map((c) => ({ slug: c.slug }));
}

export function getTopClinics(limit = 6): Clinic[] {
  return clinics
    .filter((c) => c.rating != null && c.rating >= 4.5 && c.reviewCount != null && c.reviewCount >= 50)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, limit);
}

export function getFeaturedCities(limit = 8): { city: string; state: string; count: number }[] {
  const counts: Record<string, { city: string; state: string; count: number }> = {};
  for (const c of clinics) {
    const key = `${c.city}|${c.state}`;
    if (!counts[key]) counts[key] = { city: c.city, state: c.state, count: 0 };
    counts[key].count++;
  }
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function searchClinics(params: {
  q?: string;
  zip?: string;
  rating?: string;
  sort?: string;
}): Clinic[] {
  const { q, zip, rating, sort } = params;
  const minRating = rating ? parseFloat(rating) : undefined;

  let results = clinics.filter((c) => {
    if (zip) {
      if (!c.zip || !c.zip.includes(zip.trim())) return false;
    } else if (q) {
      const term = q.trim().toLowerCase();
      const parts = term.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const cityMatch = c.city.toLowerCase().includes(parts[0]);
        const stateMatch = c.state.toLowerCase().includes(parts[1]);
        if (!cityMatch || !stateMatch) return false;
      } else {
        const matches =
          c.city.toLowerCase().includes(term) ||
          c.state.toLowerCase().includes(term) ||
          c.name.toLowerCase().includes(term);
        if (!matches) return false;
      }
    }

    if (minRating != null && (c.rating == null || c.rating < minRating)) return false;

    return true;
  });

  if (sort === "reviews") {
    results = results.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
  } else if (sort === "name") {
    results = results.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    results = results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
  }

  return results.slice(0, 100);
}
