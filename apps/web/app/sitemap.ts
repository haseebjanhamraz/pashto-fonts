import { MetadataRoute } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pashtofonts.com";

interface Font {
  slug: string;
  updatedAt: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/fonts`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ];

  try {
    // Fetch all published fonts to build dynamic links
    const res = await fetch(`${API_BASE_URL}/api/fonts?limit=1000`);
    const result = await res.json();

    if (result.success && Array.isArray(result.data?.fonts)) {
      const fontRoutes = result.data.fonts.map((font: Font) => ({
        url: `${SITE_URL}/fonts/${font.slug}`,
        lastModified: font.updatedAt ? new Date(font.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
      return [...routes, ...fontRoutes];
    }
  } catch (error) {
    console.error("[Sitemap] Dynamic sitemap compilation error:", error);
  }

  return routes;
}
