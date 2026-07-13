import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://metroplist.com/",
      changeFrequency: "weekly",
      priority: 1
    }
  ];
}
