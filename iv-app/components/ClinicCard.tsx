import Link from "next/link"
import { MapPin, Phone, Clock, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/StarRating"
import { isOpenNow, formatPhone } from "@/lib/utils"
import type { Clinic } from "@/app/generated/prisma/client"

interface ClinicCardProps {
  clinic: Clinic
}

const IV_TYPES = ["Hydration", "NAD+", "Myers Cocktail", "Immunity", "Recovery", "Beauty", "Vitamin C", "Glutathione"]

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
  const ivTypes = inferIVTypes(clinic.categories)

  return (
    <Link href={`/clinic/${clinic.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">{clinic.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{clinic.city}, {clinic.state}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold text-gray-700">{clinic.priceRange ?? "$$"}</div>
            </div>
          </div>

          {/* Rating */}
          {clinic.rating != null && (
            <div className="mb-3">
              <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount ?? undefined} size="sm" />
            </div>
          )}

          {/* IV Types */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ivTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
            ))}
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {openStatus === true && <span className="text-green-600 font-medium">Open Now</span>}
              {openStatus === false && <span className="text-red-500 font-medium">Closed</span>}
              {openStatus === null && <span className="text-gray-400">Hours vary</span>}
            </div>
            {clinic.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{formatPhone(clinic.phone)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
