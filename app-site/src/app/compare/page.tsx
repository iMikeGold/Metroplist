import type { Metadata } from "next";
import { getRuntimeRepositories } from "@/server/database";
import { ComparisonComposer } from "./comparison-composer";

export const metadata: Metadata = { title: "Compare places" };

export default async function ComparePlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string; target?: string }>;
}) {
  const { origin: originSlug, target: targetSlug } = await searchParams;
  const repositories = await getRuntimeRepositories();
  const originPlace = originSlug
    ? await repositories.places.findPlaceBySlug(originSlug)
    : null;
  const initialOrigin = originPlace
    ? await repositories.registry.findPlaceDetail(originPlace.id)
    : null;
  const targetPlace =
    initialOrigin && targetSlug
      ? await repositories.places.findPlaceBySlug(targetSlug)
      : null;
  const initialTarget = targetPlace
    ? await repositories.registry.findPlaceDetail(targetPlace.id)
    : null;

  return (
    <main>
      <p className="eyebrow">Compare</p>
      <h1>Compare places</h1>
      <p className="lede">
        Choose two places and compare measurements from a shared year and
        compatible method.
      </p>
      <ComparisonComposer
        initialOrigin={initialOrigin}
        initialTarget={initialTarget}
      />
    </main>
  );
}
