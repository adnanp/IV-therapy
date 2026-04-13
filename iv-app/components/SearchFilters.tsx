"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SlidersHorizontal } from "lucide-react"
import { TREATMENT_FILTERS } from "@/lib/data"

interface SearchFiltersProps {
  currentSort?: string
  currentRating?: string
  currentSpecialty?: string
  currentOpenNow?: string
  query: string
  variant?: "sidebar" | "mobile"
}

export function SearchFilters({ currentSort, currentRating, currentSpecialty, currentOpenNow, query, variant = "sidebar" }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (query) {
      if (/^\d{5}$/.test(query)) params.set("zip", query)
      else params.set("q", query)
    }
    const merged = { sort: currentSort, rating: currentRating, specialty: currentSpecialty, openNow: currentOpenNow, ...overrides }
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
    { label: "4.5+ ★", value: "4.5" },
    { label: "4.0+ ★", value: "4" },
    { label: "3.5+ ★", value: "3.5" },
  ]

  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
        </span>
        {TREATMENT_FILTERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => router.push(buildUrl({ specialty: currentSpecialty === opt.value ? undefined : opt.value }))}
            className={cn(
              "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
              currentSpecialty === opt.value
                ? "bg-teal-600 text-white border-teal-600 font-semibold"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        {sortOptions.slice(1).map((opt) => (
          <button
            key={opt.label}
            onClick={() => router.push(buildUrl({ sort: opt.value }))}
            className={cn(
              "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
              currentSort === opt.value
                ? "bg-teal-600 text-white border-teal-600 font-semibold"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        {ratingOptions.slice(1).map((opt) => (
          <button
            key={opt.label}
            onClick={() => router.push(buildUrl({ rating: opt.value }))}
            className={cn(
              "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
              currentRating === opt.value
                ? "bg-teal-600 text-white border-teal-600 font-semibold"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        <button
          onClick={() => router.push(buildUrl({ openNow: currentOpenNow === "1" ? undefined : "1" }))}
          className={cn(
            "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
            currentOpenNow === "1"
              ? "bg-teal-600 text-white border-teal-600 font-semibold"
              : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
          )}
        >
          🟢 Open Now
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Treatment</h3>
        <div className="space-y-1">
          {TREATMENT_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => router.push(buildUrl({ specialty: currentSpecialty === opt.value ? undefined : opt.value }))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentSpecialty === opt.value
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Sort By</h3>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => router.push(buildUrl({ sort: opt.value }))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentSort === opt.value || (!currentSort && !opt.value)
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Minimum Rating</h3>
        <div className="space-y-1">
          {ratingOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => router.push(buildUrl({ rating: opt.value }))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentRating === opt.value || (!currentRating && !opt.value)
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Availability</h3>
        <button
          onClick={() => router.push(buildUrl({ openNow: currentOpenNow === "1" ? undefined : "1" }))}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
            currentOpenNow === "1" ? "bg-teal-50 text-teal-700 font-semibold" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          🟢 Open Now
        </button>
      </div>
    </div>
  )
}
