import type { MetadataRoute } from "next";
import { getPublicationRepository } from "@/server/database";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/map",
    "/compare",
    "/data-sources",
    "/methodology",
    "/coverage",
    "/report-data-issue",
  ];
  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `https://app.metroplist.com${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
  const publications = await getPublicationRepository();
  const snapshots = publications
    ? await publications.listPublishedSlugs(10_000)
    : [];
  return [
    ...staticRoutes,
    ...snapshots.map((snapshot) => ({
      url: `https://app.metroplist.com/snapshot/${snapshot.publicSlug}`,
      lastModified: snapshot.createdAt,
      changeFrequency: "never" as const,
      priority: 0.6,
    })),
  ];
}
