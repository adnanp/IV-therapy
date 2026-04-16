import { getStates, getClinicsByState, getStateName, getCities } from "@/lib/data";
import { ClinicCard } from "@/components/ClinicCard";
import { EmailCapture } from "@/components/EmailCapture";
import { MapPin, Star, Building2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface StatePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getStates().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = slug.toUpperCase();
  const stateName = getStateName(state);
  const clinics = getClinicsByState(state);
  if (!clinics.length) return {};
  return {
    title: `IV Therapy Clinics in ${stateName} — ${clinics.length} Locations`,
    description: `Find the best IV therapy and hydration clinics in ${stateName}. Compare ${clinics.length} clinics across cities. Myers Cocktail, NAD+, immune boost, vitamin drips and more.`,
    openGraph: {
      title: `IV Therapy in ${stateName} — Top ${clinics.length} Clinics`,
      description: `Browse top-rated IV hydration clinics across ${stateName}. Real reviews, hours, and pricing.`,
    },
    alternates: { canonical: `/state/${slug}` },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { slug } = await params;
  const stateAbbr = slug.toUpperCase();
  const stateName = getStateName(stateAbbr);
  const clinics = getClinicsByState(stateAbbr);

  if (!clinics.length) notFound();

  const topRated = clinics.filter((c) => (c.rating ?? 0) >= 4.5);
  const avgRating =
    clinics.filter((c) => c.rating).reduce((s, c) => s + (c.rating ?? 0), 0) /
    (clinics.filter((c) => c.rating).length || 1);

  const stateCities = getCities()
    .filter((c) => c.state.toUpperCase() === stateAbbr)
    .sort((a, b) => b.count - a.count);

  const topClinic = clinics[0];

  const faqs = [
    {
      q: `How many IV therapy clinics are in ${stateName}?`,
      a: `There are currently ${clinics.length} IV therapy clinics listed across ${stateName} in ${stateCities.length} cities. The cities with the most clinics include ${stateCities.slice(0, 3).map(c => c.city).join(", ")}.`,
    },
    {
      q: `How much does IV therapy cost in ${stateName}?`,
      a: `IV therapy prices in ${stateName} typically range from $99–$199 for basic hydration drips to $300–$650+ for advanced treatments like NAD+ infusions. Prices vary by clinic and treatment type.`,
    },
    ...(topClinic ? [{
      q: `What is the top-rated IV therapy clinic in ${stateName}?`,
      a: `${topClinic.name} in ${topClinic.city} is one of the highest-rated IV therapy clinics in ${stateName}${topClinic.rating ? ` with a ${topClinic.rating}-star rating` : ""}${topClinic.reviewCount ? ` from ${topClinic.reviewCount} reviews` : ""}.`,
    }] : []),
    {
      q: `Is IV therapy safe in ${stateName}?`,
      a: `IV therapy in ${stateName} is administered by licensed nurses or nurse practitioners in regulated clinical settings. All clinics listed on IVDirectory are established businesses with real patient reviews.`,
    },
    {
      q: `What IV treatments are available in ${stateName}?`,
      a: `IV clinics across ${stateName} offer Myers Cocktail, NAD+ therapy, immune boost drips, hangover recovery, glutathione infusions, vitamin C high-dose therapy, athletic recovery IVs, and more. Treatment availability varies by clinic.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `IV Therapy Clinics in ${stateName}`,
      description: `Top-rated IV therapy and hydration clinics across ${stateName}`,
      numberOfItems: clinics.length,
      itemListElement: clinics.slice(0, 10).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        url: `https://ivdirectory.com/clinic/${c.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

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
            <span className="text-teal-200">{stateName}</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            IV Therapy Clinics<br />
            <span className="text-teal-300">in {stateName}</span>
          </h1>
          <p className="text-teal-100 text-lg mb-6 max-w-2xl">
            {clinics.length} verified IV therapy and hydration clinics across {stateName}.
            Compare ratings, services, and hours to find the right clinic near you.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-teal-700 text-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-x-8 gap-y-1 text-sm font-medium">
          <span className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-teal-300" />
            {clinics.length} clinics statewide
          </span>
          <span className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-teal-300" />
            {stateCities.length} cities
          </span>
          {topRated.length > 0 && (
            <span className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-teal-300" />
              {topRated.length} rated 4.5+
            </span>
          )}
        </div>
      </div>

      {/* Cities in this state */}
      {stateCities.length > 1 && (
        <div className="bg-white border-b border-gray-200 px-4 py-5">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Browse by city</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {stateCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/city/${c.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:border-teal-400 hover:bg-teal-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-teal-700 font-medium truncate">{c.city}</span>
                  <span className="text-xs text-gray-400 ml-1 shrink-0">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top clinics */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Top-Rated IV Therapy Clinics in {stateName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sorted by rating · {clinics.length} clinics statewide
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {clinics.slice(0, 9).map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
          {clinics.length > 9 && (
            <div className="mt-6 text-center">
              <Link href={`/search?q=${stateAbbr}`} className="inline-block px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
                View all {clinics.length} clinics in {stateName}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Email capture */}
      <div className="py-8 px-4">
        <div className="max-w-sm mx-auto">
          <EmailCapture variant="inline" city={stateName} />
        </div>
      </div>

      {/* FAQ */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions — IV Therapy in {stateName}
          </h2>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm sm:text-base">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO content block */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            IV Therapy in {stateName}
          </h2>
          <div className="prose prose-sm text-gray-600 space-y-3">
            <p>
              {stateName} has {clinics.length} IV therapy clinic{clinics.length !== 1 ? "s" : ""} offering
              intravenous wellness treatments across {stateCities.length} cit{stateCities.length !== 1 ? "ies" : "y"}.
              {avgRating > 0 && ` Clinics in ${stateName} average a ${avgRating.toFixed(1)}-star rating based on patient reviews.`}
            </p>
            <p>
              IV therapy sessions in {stateName} typically take 30–60 minutes and are administered by licensed
              nurses or nurse practitioners. Most clinics offer walk-in appointments or same-day bookings.
              Treatment prices generally range from $99 for basic hydration drips to $650+ for NAD+ therapy.
            </p>
            <p>
              Popular treatments available across {stateName} include Myers Cocktail, immune boost infusions,
              NAD+ therapy, glutathione drips, hangover recovery, and athletic performance IV packages.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">IV Therapy in Other States</h3>
            <div className="flex flex-wrap gap-2">
              {getStates()
                .filter((s) => s.slug !== slug)
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/state/${s.slug}`}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors"
                  >
                    {s.stateName} <span className="text-gray-400">({s.count})</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
