import { getClinic, getAllSlugs, getReviews, getEnrichment, isFeatured } from "@/lib/data";
import { TrackLink } from "@/components/TrackLink";
import { ReviewCard } from "@/components/ReviewCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin, Phone, Globe, Clock, ChevronRight,
  Droplets, ArrowLeft, Timer, CalendarCheck, Repeat, DollarSign, Sparkles, Info
} from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPhone, isOpenNow, getHoursDisplay } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const clinic = getClinic(slug);
  if (!clinic) return {};
  const enrichment = getEnrichment(slug);
  const specialties = enrichment?.specialties?.slice(0, 3).join(", ");
  const description = specialties
    ? `${clinic.name} in ${clinic.city}, ${clinic.state} offers ${specialties} and more. View hours, patient reviews, session info, and pricing.`
    : `${clinic.name} offers IV therapy and wellness infusion services in ${clinic.city}, ${clinic.state}. View hours, contact info, and patient ratings.`;
  return {
    title: `${clinic.name} – IV Therapy in ${clinic.city}, ${clinic.state}`,
    description,
    openGraph: {
      title: `${clinic.name} – IV Therapy in ${clinic.city}, ${clinic.state}`,
      description,
      type: "website",
    },
    alternates: { canonical: `/clinic/${slug}` },
  };
}

export function generateStaticParams() {
  return getAllSlugs();
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EXPECT_ITEMS = [
  { key: "sessionDuration", icon: Timer, label: "Session Duration", fallback: "Most IV drips take 30–60 minutes. NAD+ sessions may take 2–4 hours." },
  { key: "whatIsIncluded", icon: Droplets, label: "What's Included", fallback: "A health assessment, IV placement by a licensed professional, and all nutrients for your chosen drip." },
  { key: "firstVisitInfo", icon: CalendarCheck, label: "Your First Visit", fallback: "Arrive 10–15 minutes early to complete intake forms. Wear comfortable clothing with easy arm access." },
  { key: "frequency", icon: Repeat, label: "How Often to Come", fallback: "Weekly or monthly depending on your wellness goals — many clients start with 4 sessions." },
] as const;

export default async function ClinicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const clinic = getClinic(slug);
  if (!clinic) notFound();

  const openStatus = isOpenNow(clinic.hours);
  const hoursDisplay = getHoursDisplay(clinic.hours);
  const phone = formatPhone(clinic.phone);
  const reviews = getReviews(slug);
  const enrichment = getEnrichment(slug);
  const featured = isFeatured(slug);

  // Use real specialties when available, otherwise show generic services
  const specialties = enrichment?.specialties ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: clinic.name,
    description: clinic.description ??
      `${clinic.name} is an IV therapy and wellness infusion clinic in ${clinic.city}, ${clinic.state}.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.streetAddress,
      addressLocality: clinic.city,
      addressRegion: clinic.state,
      postalCode: clinic.zip,
      addressCountry: "US",
    },
    telephone: clinic.phone,
    url: clinic.website,
    priceRange: clinic.priceRange ?? "$$",
    medicalSpecialty: "IV Therapy",
    availableService: enrichment?.specialties?.map((s) => ({
      "@type": "MedicalTherapy",
      name: s,
    })),
    aggregateRating: clinic.rating
      ? { "@type": "AggregateRating", ratingValue: clinic.rating, reviewCount: clinic.reviewCount, bestRating: 5, worstRating: 1 }
      : undefined,
    review: reviews.slice(0, 3).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Mobile sticky CTA bar */}
      {(clinic.phone || clinic.website) && (
        <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
          <div className="flex gap-2 max-w-lg mx-auto">
            {clinic.phone && (
              <TrackLink href={`tel:${clinic.phone}`} slug={slug} type="call" className="flex-1">
                <Button variant="outline" className="w-full gap-2 h-11 text-sm font-semibold">
                  <Phone className="w-4 h-4" /> Call Now
                </Button>
              </TrackLink>
            )}
            {clinic.website && (
              <TrackLink href={clinic.website} slug={slug} type="book" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full h-11 text-sm font-semibold bg-teal-600 hover:bg-teal-700">
                  Book Online
                </Button>
              </TrackLink>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-teal-700 transition-colors shrink-0">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href="/search" className="hover:text-teal-700 transition-colors shrink-0">Clinics</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-gray-700 font-medium truncate">{clinic.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header */}
            <div>
              {featured && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Featured Partner Clinic
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{clinic.name}</h1>
                  <div className="flex items-start gap-1.5 mt-2 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                    <span>{clinic.streetAddress}, {clinic.city}, {clinic.state} {clinic.zip}</span>
                  </div>
                </div>
                {openStatus !== null && (
                  <span className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full ${
                    openStatus ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {openStatus ? "● Open Now" : "○ Closed"}
                  </span>
                )}
              </div>

              {clinic.rating != null && (
                <div className="mt-3">
                  <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount ?? undefined} />
                </div>
              )}

              {clinic.categories && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {clinic.categories.split(",").slice(0, 4).map((cat) => (
                    <Badge key={cat.trim()} variant="outline" className="text-xs">{cat.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 h-56 sm:h-72 bg-gray-100">
              <iframe
                title={`Map of ${clinic.name}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  `${clinic.streetAddress}, ${clinic.city}, ${clinic.state} ${clinic.zip}`
                )}&output=embed`}
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* About */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">
                {clinic.description ||
                  `${clinic.name} is an IV therapy and wellness infusion clinic in ${clinic.city}, ${clinic.state}. ` +
                  `Their team of licensed nurses and medical professionals delivers personalized IV treatments ` +
                  `to support hydration, energy, immunity, and overall wellness. ` +
                  `Walk-ins and appointments welcome — most sessions take under an hour.`}
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {specialties.length > 0 ? "Specialties & Services" : "Popular IV Treatments"}
              </h2>
              {specialties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specialties.map((s) => (
                    <div key={s} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-teal-300 transition-colors">
                      <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "Hydration IV", desc: "Replenish fluids and electrolytes fast.", detail: "Saline · Electrolytes · 30–45 min" },
                    { name: "Myers Cocktail", desc: "The gold standard for energy and immunity.", detail: "B-Complex · Vitamin C · Magnesium · 45–60 min" },
                    { name: "Immunity Boost", desc: "Fight off illness with high-dose Vitamin C.", detail: "Vitamin C · Zinc · B-Complex · 45–60 min" },
                    { name: "Recovery IV", desc: "Bounce back after exercise or a long night.", detail: "Glutathione · Magnesium · B-Complex · 45–60 min" },
                  ].map((s) => (
                    <Card key={s.name} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                            <Droplets className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{s.name}</h3>
                            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                            <p className="text-gray-400 text-xs mt-1.5">{s.detail}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* What to Expect */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">What to Expect</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EXPECT_ITEMS.map(({ key, icon: Icon, label, fallback }) => {
                  const value = enrichment?.[key as keyof typeof enrichment] as string | undefined;
                  return (
                    <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-100">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{value ?? fallback}</p>
                      </div>
                    </div>
                  );
                })}
                {enrichment?.priceNote && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 sm:col-span-2">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Pricing</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{enrichment.priceNote}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Patient Reviews */}
            {reviews.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  What Patients Are Saying
                </h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review, i) => (
                    <ReviewCard key={`${review.authorName}-${i}`} review={review} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Reviews sourced from Google. Ratings may differ from the aggregate above.
                </p>
              </section>
            )}
          </div>

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block space-y-5">
            {/* CTA Card */}
            <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Ready to book?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Reach out to {clinic.name} to schedule your session — same-day appointments often available.
                </p>
                {clinic.website && (
                  <TrackLink href={clinic.website} slug={slug} type="book" target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 h-11">Book Online</Button>
                  </TrackLink>
                )}
                {clinic.phone && (
                  <TrackLink href={`tel:${clinic.phone}`} slug={slug} type="call" className="block">
                    <Button variant="outline" className="w-full gap-2 h-11">
                      <Phone className="w-4 h-4" /> Call {phone}
                    </Button>
                  </TrackLink>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-gray-900">Contact & Info</h3>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  <span className="text-gray-600 leading-relaxed">{clinic.streetAddress}<br />{clinic.city}, {clinic.state} {clinic.zip}</span>
                </div>
                {clinic.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                    <a href={`tel:${clinic.phone}`} className="text-teal-700 hover:underline font-medium">{phone}</a>
                  </div>
                )}
                {clinic.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-teal-500 shrink-0" />
                    <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline truncate">
                      {clinic.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours */}
            {Object.keys(hoursDisplay).length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-500" /> Hours
                    </h3>
                    {openStatus !== null && (
                      <span className={`text-xs font-semibold ${openStatus ? "text-green-600" : "text-red-500"}`}>
                        {openStatus ? "Open Now" : "Closed Now"}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
                      const isToday = day === todayName;
                      return (
                        <div key={day} className={`flex justify-between text-sm ${isToday ? "font-semibold text-teal-700 bg-teal-50 -mx-2 px-2 py-0.5 rounded" : "text-gray-600"}`}>
                          <span>{day.slice(0, 3)}</span>
                          <span>{hoursDisplay[day] || "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price Range */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Price Range</h3>
                <p className="text-2xl font-bold text-teal-700">{clinic.priceRange ?? "$$"}</p>
                <p className="text-xs text-gray-500 mt-1">Typical IV therapy session: $100–$300+</p>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Claim your listing banner */}
        <div className="mt-10 mb-4 bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-teal-900 text-sm">Is this your clinic?</p>
            <p className="text-teal-700 text-xs mt-0.5">
              Claim your free listing to update details, add photos, respond to reviews, and unlock featured placement.
            </p>
          </div>
          <Link
            href={`/pricing?clinic=${encodeURIComponent(clinic.name)}&slug=${slug}`}
            className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Claim & Upgrade →
          </Link>
        </div>

        {/* Back link */}
        <div className="pb-6">
          <Link href="/search">
            <Button variant="ghost" className="gap-2 text-gray-400 hover:text-gray-700 -ml-3">
              <ArrowLeft className="w-4 h-4" /> Back to clinics
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
