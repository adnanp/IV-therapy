import posts from "@/data/blog-posts.json";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "IV Therapy Guide & Articles — IVDirectory",
  description: "Learn everything about IV therapy — Myers Cocktail, NAD+, hangover recovery, and more. Expert guides, treatment breakdowns, and tips for finding the right clinic.",
  alternates: { canonical: "/blog" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Treatments: "bg-teal-50 text-teal-700 border-teal-200",
  Wellness: "bg-green-50 text-green-700 border-green-200",
  Guides: "bg-blue-50 text-blue-700 border-blue-200",
  Science: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-teal-600 text-sm font-medium mb-3">
          <BookOpen className="w-4 h-4" />
          <span>IV Therapy Guides</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Learn About IV Therapy
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          Honest guides on treatments, costs, and what to expect — so you can make an informed decision about IV therapy.
        </p>
      </div>

      {/* Article grid */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <article className="border border-gray-200 rounded-2xl p-6 hover:border-teal-300 hover:shadow-sm transition-all bg-white">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[post.category] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-4 text-teal-600 text-sm font-semibold group-hover:text-teal-700">
                Read article →
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-teal-900 mb-2">Ready to find a clinic near you?</h2>
        <p className="text-teal-700 text-sm mb-5">Browse 273 verified IV therapy clinics with real reviews and pricing.</p>
        <Link
          href="/search"
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Find a Clinic →
        </Link>
      </div>
    </div>
  );
}
