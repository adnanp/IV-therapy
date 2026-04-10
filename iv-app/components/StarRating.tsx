import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  size?: "sm" | "md"
  showNumber?: boolean
  reviewCount?: number
}

export function StarRating({ rating, size = "md", showNumber = true, reviewCount }: StarRatingProps) {
  const stars = Math.round(rating * 2) / 2
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  const fullStars = Math.floor(stars)
  const hasHalf = stars - fullStars >= 0.5

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const isFull = i <= fullStars
          const isHalf = !isFull && hasHalf && i === fullStars + 1
          return (
            <span key={i} className="relative inline-block">
              <Star className={cn(iconSize, "text-gray-300 fill-gray-100")} />
              {(isFull || isHalf) && (
                <span className={cn("absolute inset-0 overflow-hidden", isHalf ? "w-[50%]" : "w-full")}>
                  <Star className={cn(iconSize, "text-amber-400 fill-amber-400")} />
                </span>
              )}
            </span>
          )
        })}
      </div>
      {showNumber && (
        <span className={cn(textSize, "font-medium text-gray-700")}>{rating.toFixed(1)}</span>
      )}
      {reviewCount != null && (
        <span className={cn(textSize, "text-gray-500")}>({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}
