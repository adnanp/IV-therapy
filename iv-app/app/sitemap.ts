import { MetadataRoute } from "next";
import { getAllSlugs, getCities, getStates } from "@/lib/data";
import posts from "@/data/blog-posts.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ivdirectory.com";

  const clinicUrls: MetadataRoute.Sitemap = getAllSlugs().map(({ slug }) => ({
    url: `${baseUrl}/clinic/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const cityUrls: MetadataRoute.Sitemap = getCities().map(({ slug }) => ({
    url: `${baseUrl}/city/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const stateUrls: MetadataRoute.Sitemap = getStates().map(({ slug }) => ({
    url: `${baseUrl}/state/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...stateUrls,
    ...cityUrls,
    ...blogUrls,
    ...clinicUrls,
  ];
}
