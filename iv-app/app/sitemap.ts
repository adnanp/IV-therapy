import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ivdirectory.com";

  const clinics = await prisma.clinic.findMany({
    select: { slug: true, createdAt: true },
  });

  const clinicUrls: MetadataRoute.Sitemap = clinics.map((clinic) => ({
    url: `${baseUrl}/clinic/${clinic.slug}`,
    lastModified: clinic.createdAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...clinicUrls,
  ];
}
