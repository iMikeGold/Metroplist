import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareExportPanel } from "@/components/share-export-panel";
import {
  indicatorPresentation,
  publishableIndicator,
} from "@/modules/indicators/publication";
import { formatMeasure, publicPlaceType } from "@/modules/places/presentation";
import { getRuntimeRepositories } from "@/server/database";

interface Params { placeSlug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { placeSlug } = await params;
  const { places } = await getRuntimeRepositories();
  const place = await places.findPlaceBySlug(placeSlug);
  return { title: place?.canonicalName ?? "Place" };
}

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ publish?: string }>;
}) {
  const { placeSlug } = await params;
  const { publish } = await searchParams;
  const repositories = await getRuntimeRepositories();
  const place = await repositories.places.findPlaceBySlug(placeSlug);
  if (!place) notFound();
  const [detail, indicators, evidenceHistory] = await Promise.all([
    repositories.registry.findPlaceDetail(place.id),
    repositories.registry.listPlaceIndicators(place.id),
    repositories.registry.listPlaceIndicatorEvidence(place.id),
  ]);
  if (!detail) notFound();
  const latestByIndicator = new Map<string, (typeof evidenceHistory)[number]>();
  for (const evidence of evidenceHistory) {
    if (!latestByIndicator.has(evidence.indicatorCode)) {
      latestByIndicator.set(evidence.indicatorCode, evidence);
    }
  }
  const latestEvidence = [...latestByIndicator.values()].filter((evidence) =>
    publishableIndicator(evidence.indicatorCode),
  );
  const reportParameters = new URLSearchParams({
    page: `https://app.metroplist.com/place/${detail.slug}`,
    place_ids: detail.id,
    observation_ids: latestEvidence.map((evidence) => evidence.observationId).join(","),
  });
  return (
    <main>
      <p className="eyebrow">{publicPlaceType(detail.geographyTypes, detail.placeKind)}</p>
      <h1>{detail.canonicalName}</h1>
      {detail.parentName ? <p className="lede">{detail.parentName}</p> : null}
      <section className="metrics place-record-metrics">
        {indicators.length ? indicators.map((indicator) => (
          <div key={indicator.id}>
            <span>{indicator.canonicalName}</span>
            <strong>{formatMeasure(indicator.latestValue, indicator.unit)}</strong>
            <small>
              {indicator.latestYear ?? "Year unavailable"}
              {indicator.observationStatus === "projection" ? " · projection" : indicator.estimate ? " · estimate" : ""}
              {indicator.observationCount > 1 ? ` · ${indicator.firstYear}–${indicator.lastYear}` : ""}
            </small>
          </div>
        )) : <div><span>Published measurements</span><strong>Not yet available</strong></div>}
      </section>
      <nav className="record-actions">
        <Link href={`/map?q=${encodeURIComponent(detail.canonicalName)}&place=${encodeURIComponent(detail.slug)}`}>View in Explore</Link>
        <Link href={`/compare?origin=${encodeURIComponent(detail.slug)}`}>Compare this place</Link>
        <Link href={`/report-data-issue?${reportParameters}`}>Report a data issue</Link>
      </nav>
      {latestEvidence.length ? (
        <ShareExportPanel
          snapshotType="place_profile"
          placeIds={[detail.id]}
          initialOpen={publish === "1"}
          evidence={latestEvidence.map((evidence) => ({
            observationId: evidence.observationId,
            label: indicatorPresentation(
              evidence.indicatorCode,
              evidence.indicatorName,
            ).publicLabel,
            detail: `${evidence.referenceYear ?? "Date unavailable"} · ${evidence.observationStatus}`,
          }))}
        />
      ) : null}
      <details className="provenance">
        <summary>Sources and methodology</summary>
        <p>Metroplist keeps source releases, reference years, evidence status and calculation lineage with each published measurement.</p>
      </details>
    </main>
  );
}
