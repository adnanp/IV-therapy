"use client"

import Link from "next/link"
import { MapPin, Phone, Timer, ChevronRight, GitCompare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/StarRating"
import { isOpenNow, formatPhone } from "@/lib/utils"
import { getEnrichment, isFeatured } from "@/lib/data"
import type { Clinic } from "@/lib/data"
import { useCompare } from "@/components/CompareContext"

interface ClinicCardProps {
  clinic: Clinic
}

function inferIVTypes(categories: string | null): string[] {
  if (!categories) return ["IV Therapy"]
  const lower = categories.toLowerCase()
  const found: string[] = []
  if (lower.includes("nad")) found.push("NAD+")
  if (lower.includes("hydration")) found.push("Hydration")
  if (lower.includes("myers")) found.push("Myers Cocktail")
  if (lower.includes("immunity") || lower.includes("immune")) found.push("Immunity")
  if (lower.includes("recovery")) found.push("Recovery")
  if (lower.includes("beauty") || lower.includes("glow")) found.push("Beauty")
  if (lower.includes("vitamin")) found.push("Vitamin C")
  if (found.length === 0) return ["IV Therapy", "Hydration"]
  return found.slice(0, 3)
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  const openStatus = isOpenNow(clinic.hours)
  const enrichment = getEnrichment(clinic.slug)
  const ivTypes = enrichment?.specialties?.length
    ? enrichment.specialties.slice(0, 3)
    : inferIVTypes(clinic.categories)
  const { toggle, isSelected } = useCompare()
  const selected = isSelected(clinic.slug)
  const featured = isFeatured(clinic.slug)

  return (
    <div className="block h-full group relative">
      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-2 left-4 z-10">
          <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            ⭐ Featured
          </span>
        </div>
      )}
      {/* Compare toggle */}
      <button
        onClick={(e) => { e.preventDefault(); toggle(clinic.slug, clinic.name) }}
        className={`absolute top-3 right-3 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${
          selected
            ? "bg-teal-600 text-white border-teal-600"
            : "bg-white text-gray-400 border-gray-200 hover:border-teal-400 hover:text-teal-600"
        }`}
        title={selected ? "Remove from comparison" : "Add to comparison"}
      >
        <GitCompare className="w-3 h-3" />
        {selected ? "Added" : "Compare"}
      </button>
      <Link href={`/clinic/${clinic.slug}`} className="block h-full">
      <Card className={`h-full transition-all duration-200 ${featured ? "border-amber-300 shadow-amber-100 shadow-md group-hover:border-amber-400 group-hover:shadow-lg" : "border-gray-200 group-hover:border-teal-300 group-hover:shadow-lg"}`}>
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
                {clinic.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                <span className="truncate">{clinic.city}, {clinic.state}</span>
              </div>
            </div>
            {openStatus !== null && (
              <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                openStatus
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}>
                {openStatus ? "Open" : "Closed"}
              </span>
            )}
          </div>

          {/* Rating */}
          {clinic.rating != null && (
            <div className="mb-3">
              <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount ?? undefined} size="sm" />
            </div>
          )}

          {/* Specialties */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ivTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs font-medium">{type}</Badge>
            ))}
          </div>

          {/* Session duration */}
          {enrichment?.sessionDuration && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <Timer className="w-3.5 h-3.5 shrink-0 text-teal-500" />
              <span>{enrichment.sessionDuration}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
            {clinic.phone ? (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{formatPhone(clinic.phone)}</span>
              </div>
            ) : (
              <span />
            )}
            <span className="text-xs text-teal-600 font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
              View profile <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
      </Link>
    </div>
  )
}
