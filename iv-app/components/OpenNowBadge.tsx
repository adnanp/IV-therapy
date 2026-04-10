"use client"

import { isOpenNow } from "@/lib/utils"

export function OpenNowBadge({ hours }: { hours: string | null }) {
  const openStatus = isOpenNow(hours)
  if (openStatus === null) return null
  return (
    <span className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full ${
      openStatus ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
    }`}>
      {openStatus ? "● Open Now" : "○ Closed"}
    </span>
  )
}

export function OpenNowText({ hours }: { hours: string | null }) {
  const openStatus = isOpenNow(hours)
  if (openStatus === null) return null
  return (
    <span className={`text-xs font-semibold ${openStatus ? "text-green-600" : "text-red-500"}`}>
      {openStatus ? "Open Now" : "Closed Now"}
    </span>
  )
}
