import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { CompareProvider } from "@/components/CompareContext";
import { MobileMenu } from "@/components/MobileMenu";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ivdirectory.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "IVDirectory – Find IV Therapy Clinics Near You",
    template: "%s | IVDirectory",
  },
  description:
    "Find and compare 275+ IV therapy and IV hydration clinics across the US. Search by city, state, or zip code. View ratings, hours, services, and pricing for Myers Cocktail, NAD+, immune boost, and more.",
  keywords: [
    "IV therapy clinics",
    "IV hydration near me",
    "NAD+ therapy",
    "Myers Cocktail IV",
    "IV vitamin infusion",
    "IV wellness clinic",
    "mobile IV therapy",
    "immune boost IV",
    "hangover IV drip",
  ],
  authors: [{ name: "IVDirectory" }],
  verification: {
    google: "NqZwogiUvfpwVdXygPNwTTKOAE7WcyG98ybs_1S0qMI",
  },
  openGraph: {
    type: "website",
    siteName: "IVDirectory",
    title: "IVDirectory – Find IV Therapy Clinics Near You",
    description:
      "Browse 275+ IV therapy and hydration clinics across the US. Compare ratings, services, and pricing for Myers Cocktail, NAD+, and more.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "IVDirectory – Find IV Therapy Clinics Near You",
    description:
      "Browse 275+ IV therapy and hydration clinics across the US. Compare ratings, services, and pricing.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-tight">IV</span>
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-teal-700 transition-colors">
                Directory
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/search" className="text-gray-600 hover:text-teal-700 font-medium transition-colors hidden sm:block">
                Browse Clinics
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-teal-700 font-medium transition-colors hidden sm:block">
                Guides
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-teal-700 font-medium transition-colors hidden sm:block">
                For Clinics
              </Link>
              <MobileMenu />
              <Link
                href="/search"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                Find Near Me
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <CompareProvider>{children}</CompareProvider>
        </main>

        <footer className="bg-gray-900 text-gray-400 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-teal-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">IV</span>
                  </div>
                  <span className="text-white font-bold text-base">Directory</span>
                </div>
                <p className="text-sm leading-relaxed">
                  The most comprehensive directory of IV therapy and hydration clinics in the United States.
                </p>
              </div>

              {/* Browse */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Browse</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/search" className="hover:text-white transition-colors">All Clinics</Link></li>
                  <li><Link href="/city/seattle-wa" className="hover:text-white transition-colors">Seattle, WA</Link></li>
                  <li><Link href="/city/spokane-wa" className="hover:text-white transition-colors">Spokane, WA</Link></li>
                  <li><Link href="/city/new-york-ny" className="hover:text-white transition-colors">New York, NY</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors text-amber-400">⭐ For Clinic Owners</Link></li>
                </ul>
              </div>

              {/* Treatments */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Treatments</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/search?specialty=myers" className="hover:text-white transition-colors">Myers Cocktail</Link></li>
                  <li><Link href="/search?specialty=nad" className="hover:text-white transition-colors">NAD+ Therapy</Link></li>
                  <li><Link href="/search?specialty=immune" className="hover:text-white transition-colors">Immune Boost IV</Link></li>
                  <li><Link href="/search?specialty=hangover" className="hover:text-white transition-colors">Hangover Recovery</Link></li>
                  <li><Link href="/search?specialty=athletic" className="hover:text-white transition-colors">Athletic Recovery</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <p>© {new Date().getFullYear()} IVDirectory. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
                <a href="/llms.txt" className="hover:text-white transition-colors">llms.txt</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
