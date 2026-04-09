import posts from "@/data/blog-posts.json";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ChevronRight, Tag } from "lucide-react";

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — IVDirectory`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
    alternates: { canonical: `/blog/${slug}` },
  };
}

type Block = { type: string; text: string };

function renderBlock(block: Block, i: number) {
  if (block.type === "h2") {
    return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">{block.text}</h2>;
  }
  return <p key={i} className="text-gray-600 leading-relaxed">{block.text}</p>;
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const otherPosts = posts.filter((p) => p.slug !== slug).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    publisher: {
      "@type": "Organization",
      name: "IVDirectory",
      url: "https://ivdirectory.com",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-teal-700 transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 truncate">{post.title}</span>
        </nav>

        {/* Article header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">{post.excerpt}</p>
        </div>

        {/* Article body */}
        <article className="space-y-5 text-base">
          {(post.content as Block[]).map((block, i) => renderBlock(block, i))}
        </article>

        {/* CTA */}
        <div className="mt-12 bg-teal-50 border border-teal-200 rounded-2xl p-7 text-center">
          <h2 className="text-lg font-bold text-teal-900 mb-2">Find an IV Therapy Clinic Near You</h2>
          <p className="text-teal-700 text-sm mb-4">Browse 273 verified clinics with real reviews, hours, and pricing.</p>
          <Link
            href="/search"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Search Clinics →
          </Link>
        </div>

        {/* Related posts */}
        {otherPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">More Guides</h2>
            <div className="space-y-3">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-teal-300 transition-colors group bg-white"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors leading-snug">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{p.readTime}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
