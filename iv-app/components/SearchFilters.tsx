"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SearchFiltersProps {
  currentSort?: string
  currentRating?: string
  query: string
}

export function SearchFilters({ currentSort, currentRating, query }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (query) {
      if (/^\d{5}$/.test(query)) params.set("zip", query)
      else params.set("q", query)
    }
    const merged = {
      sort: currentSort,
      rating: currentRating,
      ...overrides,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    return `${pathname}?${params.toString()}`
  }

  const sortOptions = [
    { label: "Best Match", value: undefined },
    { label: "Highest Rated", value: "rating" },
    { label: "Most Reviewed", value: "reviews" },
    { label: "Name A–Z", value: "name" },
  ]

  const ratingOptions = [
    { label: "Any Rating", value: undefined },
    { label: "4.5+ Stars", value: "4.5" },
    { label: "4+ Stars", value: "4" },
    { label: "3.5+ Stars", value: "3.5" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Sort By</h3>
        <div className="space-y-1.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => router.push(buildUrl({ sort: opt.value }))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentSort === opt.value || (!currentSort && !opt.value)
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Minimum Rating</h3>
        <div className="space-y-1.5">
          {ratingOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => router.push(buildUrl({ rating: opt.value }))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentRating === opt.value || (!currentRating && !opt.value)
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
