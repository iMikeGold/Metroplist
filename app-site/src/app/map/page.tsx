import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { AtlasExplorer } from "./atlas-explorer";

export const metadata: Metadata = { title: "Atlas" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <AtlasExplorer initialQuery={q ?? ""} />;
}
