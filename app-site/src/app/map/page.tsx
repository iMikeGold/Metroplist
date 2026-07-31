import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { AtlasExplorer } from "./atlas-explorer";

export const metadata: Metadata = { title: "Explore" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; place?: string }>;
}) {
  const { q, place } = await searchParams;
  return <AtlasExplorer initialQuery={q ?? ""} initialPlaceSlug={place ?? ""} />;
}
