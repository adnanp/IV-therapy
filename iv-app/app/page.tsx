import type { Metadata } from "next";
import Link from "next/link";
import { getTopClinics, getFeaturedCities, getAllClinics, getCities } from "@/lib/data";
import { SearchBar } from "@/components/SearchBar";
import { ClinicCard } from "@/components/ClinicCard";
import { TreatmentQuiz } from "@/components/TreatmentQuiz";
import { EmailCapture } from "@/components/EmailCapture";
import { MapPin, Star, Zap, Shield, Droplets, Brain, Dumbbell, Sparkles, BookOpen, Clock } from "lucide-react";
import posts from "@/data/blog-posts.json";

export const metadata: Metadata = {
  title: "IVDirectory – Find IV Therapy Clinics Near You",
  description:
    "Search 275+ IV therapy and hydration clinics across the US. Compare Myers Cocktail, NAD+, immune boost, hangover recovery, and mobile IV services near you.",
  openGraph: {
    title: "IVDirectory – Find IV Therapy Clinics Near You",
    description:
      "Search 275+ IV therapy and hydration clinics across the US. Compare services, ratings, and pricing.",
  },
};

const TREATMENTS = [
  { icon: <Droplets className="w-5 h-5" />, label: "Myers Cocktail", desc: "The gold standard IV drip for energy, immunity, and overall wellness.", specialty: "myers" },
  { icon: <Brain className="w-5 h-5" />, label: "NAD+ Therapy", desc: "Cellular energy, anti-aging, and brain health — sessions from 2–4 hours.", specialty: "nad" },
  { icon: <Shield className="w-5 h-5" />, label: "Immune Boost", desc: "High-dose Vitamin C, Zinc, and antioxidants to fight off illness fast.", specialty: "immune" },
  { icon: <Zap className="w-5 h-5" />, label: "Hangover Recovery", desc: "Fluids, anti-nausea meds, and B-vitamins — feel human again in an hour.", specialty: "hangover" },
  { icon: <Dumbbell className="w-5 h-5" />, label: "Athletic Recovery", desc: "Amino acids, Magnesium, and electrolytes to accelerate muscle repair.", specialty: "athletic" },
  { icon: <Sparkles className="w-5 h-5" />, label: "Beauty & Glow", desc: "Glutathione, Biotin, and Vitamin C for radiant skin and healthy hair.", specialty: "beauty" },
];

const FAQ = [
  {
    q: "How long does an IV therapy session take?",
    a: "Most IV drips take 30–60 minutes. NAD+ therapy takes 2–4 hours depending on the dose. IM injections take about 10 minutes.",
  },
  {
    q: "Is IV therapy safe?",
    a: "When administered by a licensed nurse or nurse practitioner, IV therapy is considered safe for most healthy adults. Reputable clinics require a health intake form and may require recent lab work for advanced therapies.",
  },
  {
    q: "How much does IV therapy cost?",
    a: "Basic hydration drips typically start around $99–$150. A Myers' Cocktail runs $150–$275. NAD+ therapy ranges from $250–$650+ per session. Many clinics offer monthly memberships that reduce the per-session cost.",
  },
  {
    q: "What is a Myers' Cocktail IV?",
    a: "A Myers' Cocktail is the most popular IV drip formula. It contains Magnesium, Calcium, B-Complex vitamins, B12, and Vitamin C. It's used to treat fatigue, migraines, seasonal allergies, fibromyalgia, and general wellness.",
  },
  {
    q: "What is NAD+ IV therapy used for?",
    a: "NAD+ (nicotinamide adenine dinucleotide) is a coenzyme involved in cellular energy production. IV NAD+ therapy is used for anti-aging, chronic fatigue, brain health, addiction recovery, and neurological support.",
  },
  {
    q: "Do I need a prescription for IV therapy?",
    a: "Most wellness IV therapy does not require a prescription — a nurse or medical director provides oversight. Some advanced therapies like high-dose Vitamin C or prescription add-ons (Toradol, Zofran) require medical clearance.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "IVDirectory",
  url: "https://ivdirectory.com",
  description: "Directory of IV therapy and hydration clinics across the United States",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: "https://ivdirectory.com/search?q={search_term_string}" },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  const topClinics = getTopClinics(6);
  const featuredCities = getFeaturedCities(8);
  const allCities = getCities();
  const totalClinics = getAllClinics().length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center px-4 py-24 sm:py-32">
          <div className="inline-flex items-center gap-2 bg-teal-800/60 border border-teal-600/40 rounded-full px-4 py-1.5 text-sm text-teal-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            {totalClinics}+ verified clinics across the US
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
            Find IV Therapy<br />
            <span className="text-teal-300">Clinics Near You</span>
          </h1>
          <p className="text-teal-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Compare top-rated IV hydration, NAD+, Myers Cocktail, and wellness infusion clinics.
            Real data. Real reviews. Book with confidence.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar size="lg" placeholder="City, state, or zip code..." />
          </div>
          <p className="text-teal-400 text-xs mt-4">
            Try: &quot;Seattle, WA&quot; · &quot;New York, NY&quot; · &quot;98101&quot;
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
          <span className="flex items-center gap-2"><span className="text-teal-200">✓</span> {totalClinics}+ Clinics Listed</span>
          <span className="flex items-center gap-2"><span className="text-teal-200">✓</span> 20+ States Covered</span>
          <span className="flex items-center gap-2"><span className="text-teal-200">✓</span> Real Ratings &amp; Reviews</span>
          <span className="flex items-center gap-2"><span className="text-teal-200">✓</span> Session Duration &amp; Pricing</span>
        </div>
      </div>

      {/* Browse by Treatment */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What Are You Looking For?</h2>
            <p className="text-gray-500 mt-2">Browse clinics by treatment type</p>
          </div>
          {/* Mobile: horizontal scroll. Desktop: 6-col grid */}
          <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {TREATMENTS.map(({ icon, label, desc, specialty }) => (
              <Link
                key={label}
                href={`/search?specialty=${specialty}`}
                className="group flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white hover:border-teal-400 hover:shadow-md transition-all shrink-0 w-36 sm:w-auto"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-teal-600 mb-3 transition-colors">
                  {icon}
                </div>
                <span className="font-semibold text-gray-900 text-sm leading-snug">{label}</span>
                <span className="text-gray-400 text-xs mt-1 leading-snug hidden sm:block">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Quiz */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Not Sure Which IV to Get?</h2>
            <p className="text-gray-500 mt-2">Answer 3 quick questions and we&apos;ll match you to the right treatment.</p>
          </div>
          <TreatmentQuiz />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Book Your IV Session in 3 Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <MapPin className="w-7 h-7 text-teal-600" />,
                title: "Search Your Area",
                desc: "Enter your city, state, or zip code to see nearby clinics with ratings, hours, and services.",
              },
              {
                step: "2",
                icon: <Star className="w-7 h-7 text-teal-600" />,
                title: "Compare Clinics",
                desc: "View session duration, what&apos;s included, specialties, and verified patient reviews side by side.",
              },
              {
                step: "3",
                icon: <Zap className="w-7 h-7 text-teal-600" />,
                title: "Book & Recharge",
                desc: "Click through to the clinic&apos;s website or call to book — most clinics offer same-day appointments.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 bg-white rounded-full border-2 border-teal-100 flex items-center justify-center shadow-sm">
                    {icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Clinics */}
      {topClinics.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top Rated Clinics</h2>
                <p className="text-gray-500 mt-1">Highest-rated IV therapy providers based on verified patient reviews</p>
              </div>
              <Link href="/search" className="text-teal-600 hover:text-teal-800 font-semibold text-sm transition-colors whitespace-nowrap">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {topClinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Cities */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse by City</h2>
            <p className="text-gray-500 mt-1">Popular IV therapy locations across the country</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {featuredCities.map((c) => {
              const cityData = allCities.find((ac) => ac.city === c.city && ac.state === c.state);
              return (
              <Link
                key={`${c.city}-${c.state}`}
                href={cityData ? `/city/${cityData.slug}` : `/search?q=${encodeURIComponent(`${c.city}, ${c.state}`)}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all group"
              >
                <div>
                  <span className="font-medium text-gray-800 group-hover:text-teal-700 text-sm block">{c.city}</span>
                  <span className="text-xs text-gray-400">{c.state}</span>
                </div>
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{c.count}</span>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-500 mt-2">Everything you need to know about IV therapy</p>
          </div>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border border-gray-200 rounded-xl p-6 bg-white">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">IV Therapy Guides &amp; Research</h2>
              <p className="text-gray-500 mt-1">Evidence-based articles to help you make informed decisions</p>
            </div>
            <Link href="/blog" className="text-teal-600 hover:text-teal-800 font-semibold text-sm transition-colors whitespace-nowrap flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              View all guides →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {posts.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-teal-400 hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 group-hover:text-teal-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-teal-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Feel Your Best?</h2>
          <p className="text-teal-100 mb-8">
            Search {totalClinics}+ IV therapy clinics and find one near you — same-day appointments often available.
          </p>
          <Link
            href="/search"
            className="inline-block bg-white text-teal-700 font-bold px-8 py-3.5 rounded-xl hover:bg-teal-50 transition-colors text-sm"
          >
            Find a Clinic Near Me
          </Link>
        </div>
      </section>

      {/* Email capture */}
      <EmailCapture variant="banner" />
    </>
  );
}
