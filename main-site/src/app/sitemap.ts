import type { MetadataRoute } from "next";
import { institutionalPages } from "@/content/institutional-pages";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://metroplist.com/",
      changeFrequency: "weekly",
      priority: 1
    },
    ...Object.keys(institutionalPages).map((slug) => ({
      url: `https://metroplist.com/${slug}/`,
      changeFrequency: "monthly" as const,
      priority: slug === "data-and-trust" ? 0.8 : 0.6,
    })),
  ];
}
