import { getCities, getClinicsByCity } from "@/lib/data";
import { ClinicCard } from "@/components/ClinicCard";
import { SearchBar } from "@/components/SearchBar";
import { EmailCapture } from "@/components/EmailCapture";
import { MapPin, Star, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

function parseCitySlug(slug: string): { city: string; state: string } | null {
  const cities = getCities();
  const match = cities.find((c) => c.slug === slug);
  if (!match) return null;
  return { city: match.city, state: match.state };
}

export async function generateStaticParams() {
  return getCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseCitySlug(slug);
  if (!parsed) return {};
  const { city, state } = parsed;
  const clinics = getClinicsByCity(city, state);
  return {
    title: `IV Therapy Clinics in ${city}, ${state} — ${clinics.length} Locations`,
    description: `Find the best IV therapy and hydration clinics in ${city}, ${state}. Compare ratings, services, hours, and pricing for ${clinics.length} clinics. Myers Cocktail, NAD+, immune boost, and more.`,
    openGraph: {
      title: `IV Therapy in ${city}, ${state} — Top ${clinics.length} Clinics`,
      description: `Compare top-rated IV hydration clinics in ${city}, ${state}. Real reviews, hours, and pricing.`,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const parsed = parseCitySlug(slug);
  if (!parsed) notFound();

  const { city, state } = parsed;
  const clinics = getClinicsByCity(city, state);
  const avgRating =
    clinics.filter((c) => c.rating).reduce((sum, c) => sum + (c.rating ?? 0), 0) /
    (clinics.filter((c) => c.rating).length || 1);
  const topRated = clinics.filter((c) => (c.rating ?? 0) >= 4.5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `IV Therapy Clinics in ${city}, ${state}`,
    description: `Top-rated IV therapy and hydration clinics in ${city}, ${state}`,
    numberOfItems: clinics.length,
    itemListElement: clinics.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `https://ivdirectory.com/clinic/${c.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 text-white px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-teal-400 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-white transition-colors">Clinics</Link>
            <span>/</span>
            <span className="text-teal-200">{city}, {state}</span>
          </nav>
          <div className="flex items-center gap-2 text-teal-300 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{city}, {state}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            IV Therapy Clinics<br />
            <span className="text-teal-300">in {city}</span>
          </h1>
          <p className="text-teal-100 text-lg mb-8 max-w-2xl">
            {clinics.length} verified IV therapy and hydration clinics in {city}, {state}.
            Compare ratings, services, and hours to find the right clinic for you.
          </p>
          <div className="max-w-xl">
            <SearchBar defaultValue={`${city}, ${state}`} />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-teal-700 text-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-x-8 gap-y-1 text-sm font-medium">
          <span className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-teal-300" />
            {clinics.length} clinics in {city}
          </span>
          {topRated.length > 0 && (
            <span className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-teal-300" />
              {topRated.length} rated 4.5+
            </span>
          )}
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-teal-300" />
            Most offer same-day appointments
          </span>
        </div>
      </div>

      {/* Clinic list */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                All IV Therapy Clinics in {city}, {state}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sorted by rating · {clinics.length} clinics found
              </p>
            </div>
          </div>

          {clinics.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-gray-800 mb-2">No clinics listed yet</p>
              <p className="text-sm text-gray-500 mb-6">IV therapy is expanding fast in {city}.</p>
              <Link href="/search" className="text-teal-600 font-semibold hover:underline">Browse all clinics →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Email capture */}
      <div className="py-8 px-4">
        <div className="max-w-sm mx-auto">
          <EmailCapture variant="inline" city={city} />
        </div>
      </div>

      {/* SEO content block */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            About IV Therapy in {city}, {state}
          </h2>
          <div className="prose prose-sm text-gray-600 space-y-3">
            <p>
              {city} has {clinics.length} IV therapy clinic{clinics.length !== 1 ? "s" : ""} offering a range of
              intravenous treatments including Myers Cocktail drips, NAD+ infusions, immune boost formulas, hydration
              therapy, and more. {avgRating > 0 && `Clinics in ${city} average a ${avgRating.toFixed(1)}-star rating based on patient reviews.`}
            </p>
            <p>
              Most IV therapy sessions in {city} take 30–60 minutes and are administered by licensed nurses or nurse
              practitioners. Many clinics offer walk-in appointments or same-day bookings. Prices typically range from
              $99 for basic hydration to $650+ for NAD+ therapy.
            </p>
            <p>
              Whether you&apos;re looking for hangover recovery, athletic performance support, immune system boosting,
              or general wellness maintenance, {city}&apos;s IV therapy clinics can help you feel your best.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Browse Other Cities</h3>
            <div className="flex flex-wrap gap-2">
              {getCities()
                .filter((c) => !(c.city === city && c.state === state))
                .slice(0, 12)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors"
                  >
                    {c.city}, {c.state}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
