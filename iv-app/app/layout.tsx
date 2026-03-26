import type { Metadata } from "next";

import "./globals.css";
import Link from "next/link";


export const metadata: Metadata = {
  title: {
    default: "IVDirectory – Find IV Therapy Clinics Near You",
    template: "%s | IVDirectory",
  },
  description: "Find and compare IV therapy clinics near you. Search by city, state, or zip code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-teal-700 tracking-tight">IV<span className="text-gray-900">Directory</span></span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/search" className="hover:text-teal-700 transition-colors">Browse Clinics</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <span className="text-lg font-bold text-teal-700">IV<span className="text-gray-900">Directory</span></span>
                <p className="text-sm text-gray-500 mt-1">Find IV therapy clinics near you.</p>
              </div>
              <div className="flex gap-8 text-sm text-gray-500">
                <Link href="/search" className="hover:text-teal-700">Browse Clinics</Link>
                <Link href="/sitemap.xml" className="hover:text-teal-700">Sitemap</Link>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6">© {new Date().getFullYear()} IVDirectory. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
