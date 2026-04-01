import { getClinic, getAllSlugs, getReviews, getEnrichment } from "@/lib/data";
import { ReviewCard } from "@/components/ReviewCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin, Phone, Globe, Clock, ChevronRight,
  Droplets, ArrowLeft
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
    alternates: {
      canonical: `/clinic/${slug}`,
    },
  };
}

export function generateStaticParams() {
  return getAllSlugs();
}

const IV_SERVICES = [
  { name: "Hydration IV", description: "Replenish fluids and electrolytes for optimal hydration.", ingredients: "Saline, Electrolytes", duration: "30–45 min", price: null },
  { name: "Myers Cocktail", description: "Classic blend of vitamins and minerals for overall wellness.", ingredients: "Magnesium, B-Complex, Vitamin C, B12", duration: "45–60 min", price: null },
  { name: "Immunity Boost", description: "High-dose Vitamin C and zinc to support immune function.", ingredients: "Vitamin C, Zinc, B-Complex", duration: "45–60 min", price: null },
  { name: "Recovery IV", description: "Reduce inflammation and bounce back after intense activity or illness.", ingredients: "Glutathione, B-Complex, Magnesium", duration: "45–60 min", price: null },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function ClinicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const clinic = getClinic(slug);

  if (!clinic) notFound();

  const openStatus = isOpenNow(clinic.hours);
  const hoursDisplay = getHoursDisplay(clinic.hours);
  const phone = formatPhone(clinic.phone);
  const services = IV_SERVICES.slice(0, 4);
  const reviews = getReviews(slug);
  const enrichment = getEnrichment(slug);

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
    geo: {
      "@type": "GeoCoordinates",
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
      ? {
          "@type": "AggregateRating",
          ratingValue: clinic.rating,
          reviewCount: clinic.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-teal-700">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/search" className="hover:text-teal-700">Clinics</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium truncate">{clinic.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">{clinic.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-500">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{clinic.streetAddress}, {clinic.city}, {clinic.state} {clinic.zip}</span>
                  </div>
                </div>
                {openStatus !== null && (
                  <Badge variant={openStatus ? "success" : "destructive"} className="shrink-0 mt-1">
                    {openStatus ? "Open Now" : "Closed"}
                  </Badge>
                )}
              </div>

              {clinic.rating != null && (
                <div className="mt-4">
                  <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount ?? undefined} />
                </div>
              )}

              {clinic.categories && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {clinic.categories.split(",").slice(0, 4).map((cat) => (
                    <Badge key={cat.trim()} variant="outline">{cat.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-gray-200 h-64 bg-gray-100">
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
                  `${clinic.name} is an IV therapy and wellness infusion clinic located in ${clinic.city}, ${clinic.state}. ` +
                  `They offer a range of IV treatments designed to support hydration, recovery, immunity, and overall wellness. ` +
                  `Book an appointment to experience personalized IV therapy from their team of trained professionals.`}
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Services & Treatments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Card key={service.name} className="border-gray-200">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                          <Droplets className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{service.name}</h3>
                          {service.description && (
                            <p className="text-gray-500 text-xs mt-1 leading-relaxed">{service.description}</p>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                            {service.ingredients && <span>💊 {service.ingredients}</span>}
                            {service.duration && <span>⏱ {service.duration}</span>}
                            {service.price && <span className="font-medium text-teal-700">{service.price}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Patient Reviews */}
            {reviews.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Reviews</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review, i) => (
                    <ReviewCard key={`${review.placeId}-${i}`} review={review} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Reviews sourced from Google. Displayed ratings may differ from the aggregate score above.
                </p>
              </section>
            )}

            {/* What to Expect */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">What to Expect</h2>
              <div className="bg-teal-50 rounded-xl p-6 space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Session Duration: </span>
                  {enrichment?.sessionDuration ?? "Most IV drips take 30–60 minutes. NAD+ sessions may take 2–4 hours."}
                </p>
                <p>
                  <span className="font-semibold">What&apos;s Included: </span>
                  {enrichment?.whatIsIncluded ?? "A pre-treatment health assessment, IV placement by a licensed medical professional, and post-treatment monitoring."}
                </p>
                <p>
                  <span className="font-semibold">First Visit: </span>
                  {enrichment?.firstVisitInfo ?? "Arrive 10–15 minutes early to complete intake forms. Wear comfortable clothing with easy arm access."}
                </p>
                <p>
                  <span className="font-semibold">Frequency: </span>
                  {enrichment?.frequency ?? "Treatments can be done weekly or monthly depending on your wellness goals."}
                </p>
                {enrichment?.priceNote && (
                  <p>
                    <span className="font-semibold">Pricing: </span>
                    {enrichment.priceNote}
                  </p>
                )}
                {enrichment?.specialties && enrichment.specialties.length > 0 && (
                  <p>
                    <span className="font-semibold">Specialties: </span>
                    {enrichment.specialties.join(", ")}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* CTA Card */}
            <Card className="border-teal-200 bg-teal-50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Book an Appointment</h3>
                <p className="text-sm text-gray-600">Contact {clinic.name} to schedule your IV therapy session.</p>
                {clinic.website && (
                  <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full">Book Online</Button>
                  </a>
                )}
                {clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <Phone className="w-4 h-4" /> Call {phone}
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-gray-900">Contact & Info</h3>

                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <span className="text-gray-600">{clinic.streetAddress}<br />{clinic.city}, {clinic.state} {clinic.zip}</span>
                </div>

                {clinic.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                    <a href={`tel:${clinic.phone}`} className="text-teal-700 hover:underline">{phone}</a>
                  </div>
                )}

                {clinic.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-teal-600 shrink-0" />
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
                      <Clock className="w-4 h-4 text-teal-600" /> Hours
                    </h3>
                    {openStatus !== null && (
                      <span className={`text-xs font-medium ${openStatus ? "text-green-600" : "text-red-500"}`}>
                        {openStatus ? "Open Now" : "Closed Now"}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
                      const isToday = day === todayName;
                      return (
                        <div key={day} className={`flex justify-between text-sm ${isToday ? "font-semibold text-teal-700" : "text-gray-600"}`}>
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

        {/* Back link */}
        <div className="mt-10">
          <Link href="/search">
            <Button variant="ghost" className="gap-2 text-gray-500">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
