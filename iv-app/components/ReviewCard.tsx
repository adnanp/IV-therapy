import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/data";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      {/* Header: author + stars */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {review.authorPhotoUrl ? (
            <img
              src={review.authorPhotoUrl}
              alt={review.authorName}
              className="w-9 h-9 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <span className="text-teal-700 text-sm font-semibold">
                {review.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.authorName}</p>
            <p className="text-xs text-gray-400">{review.relativeTimeDescription}</p>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "w-3.5 h-3.5",
                i <= review.rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-200 fill-gray-100"
              )}
            />
          ))}
        </div>
      </div>

      {/* Review text */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{review.text}</p>

      {/* Attribution */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
        {review.source === "google" ? (
          <>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-label="Google">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-xs text-gray-400">via Google</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#00b67a" aria-label="Trustpilot">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <span className="text-xs text-gray-400">via Trustpilot</span>
          </>
        )}
      </div>
    </div>
  );
}
