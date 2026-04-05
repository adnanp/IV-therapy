import { MetadataRoute } from "next";
import { getAllSlugs, getCities } from "@/lib/data";

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

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...cityUrls,
    ...clinicUrls,
  ];
}
