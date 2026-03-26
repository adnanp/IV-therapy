import { prisma } from "@/lib/prisma";
import { ClinicCard } from "@/components/ClinicCard";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/components/SearchFilters";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    zip?: string;
    rating?: string;
    open?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || params.zip || "All Clinics";
  return {
    title: `IV Therapy Clinics – ${query}`,
    description: `Find IV therapy clinics near ${query}. Compare ratings, hours, and services.`,
  };
}

async function searchClinics(params: {
  q?: string;
  zip?: string;
  rating?: string;
  open?: string;
  sort?: string;
}) {
  const { q, zip, rating, sort } = params;

  const minRating = rating ? parseFloat(rating) : undefined;

  let where: Record<string, unknown> = {};

  if (zip) {
    where = { zip: { contains: zip.trim() } };
  } else if (q) {
    const term = q.trim();
    // Check if it looks like "City, ST" or just a city name
    const parts = term.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      where = {
        AND: [
          { city: { contains: parts[0], mode: "insensitive" } },
          { state: { contains: parts[1], mode: "insensitive" } },
        ],
      };
    } else {
      where = {
        OR: [
          { city: { contains: term, mode: "insensitive" } },
          { state: { contains: term, mode: "insensitive" } },
          { name: { contains: term, mode: "insensitive" } },
        ],
      };
    }
  }

  if (minRating) {
    where = { ...where, rating: { gte: minRating } };
  }

  const orderBy =
    sort === "reviews"
      ? [{ reviewCount: "desc" as const }]
      : sort === "name"
      ? [{ name: "asc" as const }]
      : [{ rating: "desc" as const }, { reviewCount: "desc" as const }];

  return prisma.clinic.findMany({ where, orderBy, take: 100 });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const clinics = await searchClinics(params);
  const query = params.q || params.zip || "";
  const hasSearch = !!query;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <div className="mb-8 max-w-xl">
        <SearchBar defaultValue={query} />
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <SearchFilters currentSort={params.sort} currentRating={params.rating} query={query} />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {hasSearch ? `IV Therapy Clinics near "${query}"` : "All IV Therapy Clinics"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{clinics.length} result{clinics.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {clinics.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg font-medium mb-2">No clinics found</p>
              <p className="text-sm">Try a different city, state, or zip code.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
