import { getClinic, getEnrichment } from "@/lib/data";
import Link from "next/link";
import { Star, MapPin, Phone, Timer, CheckCircle, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ComparePageProps {
  searchParams: Promise<{ slugs?: string }>;
}

export const metadata: Metadata = {
  title: "Compare IV Therapy Clinics Side by Side",
  description: "Compare IV therapy clinics side by side — ratings, services, session duration, pricing, and hours.",
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-400 text-sm">No rating</span>;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
    </div>
  );
}

const ROWS = [
  { label: "Rating", key: "rating" },
  { label: "Address", key: "address" },
  { label: "Phone", key: "phone" },
  { label: "Price Range", key: "priceRange" },
  { label: "Session Duration", key: "sessionDuration" },
  { label: "What's Included", key: "whatIsIncluded" },
  { label: "First Visit", key: "firstVisitInfo" },
  { label: "Frequency", key: "frequency" },
  { label: "Specialties", key: "specialties" },
  { label: "Pricing Note", key: "priceNote" },
];

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { slugs } = await searchParams;
  if (!slugs) notFound();

  const slugList = slugs.split(",").slice(0, 3).filter(Boolean);
  if (slugList.length < 2) notFound();

  const clinics = slugList.map((slug) => {
    const clinic = getClinic(slug);
    const enrichment = getEnrichment(slug);
    return clinic ? { clinic, enrichment } : null;
  }).filter(Boolean) as { clinic: NonNullable<ReturnType<typeof getClinic>>; enrichment: ReturnType<typeof getEnrichment> }[];

  if (clinics.length < 2) notFound();

  function getCellValue(data: typeof clinics[0], key: string) {
    const { clinic, enrichment } = data;
    switch (key) {
      case "rating":
        return <StarRating rating={clinic.rating} />;
      case "address":
        return (
          <span className="text-sm text-gray-700">
            {[clinic.streetAddress, clinic.city, clinic.state].filter(Boolean).join(", ")}
          </span>
        );
      case "phone":
        return clinic.phone ? (
          <a href={`tel:${clinic.phone}`} className="text-teal-600 hover:underline text-sm flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> {clinic.phone}
          </a>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "priceRange":
        return clinic.priceRange ? (
          <span className="text-sm font-semibold text-gray-700">{clinic.priceRange}</span>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "sessionDuration":
        return enrichment?.sessionDuration ? (
          <div className="flex items-start gap-1.5 text-sm text-gray-700">
            <Timer className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
            {enrichment.sessionDuration}
          </div>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "whatIsIncluded":
        return enrichment?.whatIsIncluded ? (
          <p className="text-sm text-gray-700 leading-relaxed">{enrichment.whatIsIncluded}</p>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "firstVisitInfo":
        return enrichment?.firstVisitInfo ? (
          <p className="text-sm text-gray-700 leading-relaxed">{enrichment.firstVisitInfo}</p>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "frequency":
        return enrichment?.frequency ? (
          <p className="text-sm text-gray-700">{enrichment.frequency}</p>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "specialties":
        return enrichment?.specialties?.length ? (
          <ul className="space-y-1">
            {enrichment.specialties.map((s) => (
              <li key={s} className="flex items-center gap-1.5 text-sm text-gray-700">
                <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        ) : <span className="text-gray-400 text-sm">—</span>;
      case "priceNote":
        return enrichment?.priceNote ? (
          <p className="text-sm text-gray-600 italic">{enrichment.priceNote}</p>
        ) : <span className="text-gray-400 text-sm">—</span>;
      default:
        return null;
    }
  }

  const headerGridClass = clinics.length === 2 ? "grid-cols-2" : "grid-cols-3";
  const rowGridClass = clinics.length === 2 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-teal-600 transition-colors">Clinics</Link>
        <span>/</span>
        <span className="text-gray-600">Compare</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Compare Clinics</h1>
      <p className="text-gray-500 text-sm mb-8">Side-by-side comparison of IV therapy clinics</p>

      {/* Clinic header cards */}
      <div className={`grid ${headerGridClass} gap-4 mb-8`}>
        {clinics.map(({ clinic }) => (
          <div key={clinic.slug} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 text-base leading-snug mb-2">{clinic.name}</h2>
            {clinic.rating && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-sm">{clinic.rating.toFixed(1)}</span>
                {clinic.reviewCount && <span className="text-gray-400 text-xs">({clinic.reviewCount} reviews)</span>}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <MapPin className="w-3 h-3" />
              {clinic.city}, {clinic.state}
            </div>
            <div className="flex flex-col gap-2">
              {clinic.website && (
                <a
                  href={clinic.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  Book Online <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <Link
                href={`/clinic/${clinic.slug}`}
                className="flex items-center justify-center text-xs text-teal-600 hover:underline font-medium"
              >
                View full profile →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {ROWS.map((row, i) => (
          <div
            key={row.key}
            className={`grid ${rowGridClass} ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
          >
            {/* Row label */}
            <div className="px-4 py-4 border-r border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{row.label}</span>
            </div>
            {/* Cell per clinic */}
            {clinics.map(({ clinic, enrichment }) => (
              <div key={clinic.slug} className="px-4 py-4 border-r border-gray-100 last:border-r-0">
                {getCellValue({ clinic, enrichment }, row.key)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/search" className="text-teal-600 hover:underline text-sm font-medium">
          ← Back to search
        </Link>
      </div>
    </div>
  );
}
