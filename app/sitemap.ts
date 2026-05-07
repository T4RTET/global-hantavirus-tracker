import type { MetadataRoute } from "next";
import { getCountryStats } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const countries = await getCountryStats();
  return [
    { url: `${baseUrl}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/latest`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/x-news`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${baseUrl}/hantavirus`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...countries.map((country) => ({
      url: `${baseUrl}/country/${country.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8
    }))
  ];
}
