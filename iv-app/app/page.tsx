import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchBar } from "@/components/SearchBar";
import { ClinicCard } from "@/components/ClinicCard";
import { MapPin, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getTopClinics() {
  return prisma.clinic.findMany({
    where: { rating: { gte: 4.5 }, reviewCount: { gte: 50 } },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: 6,
  });
}

async function getFeaturedCities() {
  const cities = await prisma.clinic.groupBy({
    by: ["city", "state"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  });
  return cities;
}

export default async function HomePage() {
  const [topClinics, featuredCities] = await Promise.all([getTopClinics(), getFeaturedCities()]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Find IV Therapy Clinics<br />Near You
          </h1>
          <p className="text-teal-100 text-lg mb-10">
            Compare top-rated IV hydration, NAD+, and wellness infusion clinics in your area.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar size="lg" placeholder="Search by city, state, or zip code..." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <MapPin className="w-8 h-8 text-teal-600" />, title: "Search", desc: "Enter your city, state, or zip code to find nearby clinics." },
              { icon: <Star className="w-8 h-8 text-teal-600" />, title: "Compare", desc: "View ratings, services, hours, and contact info side by side." },
              { icon: <Calendar className="w-8 h-8 text-teal-600" />, title: "Book", desc: "Click through to the clinic's website or call to book your session." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">{icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by City</h2>
          <p className="text-gray-500 mb-8">Popular locations across the country</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {featuredCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/search?q=${encodeURIComponent(`${c.city}, ${c.state}`)}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all group"
              >
                <span className="font-medium text-gray-800 group-hover:text-teal-700 text-sm">{c.city}, {c.state}</span>
                <span className="text-xs text-gray-400">{c._count.id}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Clinics */}
      {topClinics.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Top Rated Clinics</h2>
                <p className="text-gray-500 mt-1">Highly reviewed IV therapy providers</p>
              </div>
              <Link href="/search">
                <Button variant="outline">View All</Button>
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
    </div>
  );
}
