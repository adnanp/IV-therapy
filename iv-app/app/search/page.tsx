import { searchClinics, TREATMENT_FILTERS } from "@/lib/data";
import { ClinicCard } from "@/components/ClinicCard";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/components/SearchFilters";
import { SearchX } from "lucide-react";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    zip?: string;
    rating?: string;
    sort?: string;
    specialty?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || params.zip;
  return {
    title: query
      ? `IV Therapy Clinics in ${query}`
      : "Browse All IV Therapy Clinics",
    description: query
      ? `Find the best IV therapy and hydration clinics near ${query}. Compare ratings, services, and hours.`
      : "Browse all IV therapy and hydration clinics in our directory. Filter by rating, sort by reviews, and find the right clinic for you.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const clinics = searchClinics(params);
  const query = params.q || params.zip || "";
  const hasSearch = !!(query || params.specialty);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Search bar */}
      <div className="mb-4 max-w-xl">
        <SearchBar defaultValue={query} />
      </div>

      {/* Mobile filter pills — visible only below lg */}
      <div className="lg:hidden mb-5">
        <SearchFilters
          variant="mobile"
          currentSort={params.sort}
          currentRating={params.rating}
          currentSpecialty={params.specialty}
          query={query}
        />
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block w-52 shrink-0 pt-1">
          <SearchFilters currentSort={params.sort} currentRating={params.rating} currentSpecialty={params.specialty} query={query} />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {params.specialty
                  ? `${TREATMENT_FILTERS.find(t => t.value === params.specialty)?.label ?? params.specialty} Clinics${query ? ` near "${query}"` : ""}`
                  : query
                  ? `IV Therapy Clinics near "${query}"`
                  : "All IV Therapy Clinics"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {clinics.length === 0
                  ? "No results"
                  : `${clinics.length} clinic${clinics.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>

          {clinics.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">No clinics found here yet</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                IV therapy is expanding fast — try a nearby city, a broader search, or{" "}
                <a href="/search" className="text-teal-600 hover:underline font-medium">browse all clinics</a>.
              </p>
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
