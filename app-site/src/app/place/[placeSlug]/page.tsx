import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMeasure, publicPlaceType } from "@/modules/places/presentation";
import { getRuntimeRepositories } from "@/server/database";

interface Params { placeSlug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { placeSlug } = await params;
  const { places } = await getRuntimeRepositories();
  const place = await places.findPlaceBySlug(placeSlug);
  return { title: place?.canonicalName ?? "Place" };
}

export default async function PlacePage({ params }: { params: Promise<Params> }) {
  const { placeSlug } = await params;
  const repositories = await getRuntimeRepositories();
  const place = await repositories.places.findPlaceBySlug(placeSlug);
  if (!place) notFound();
  const [detail, indicators] = await Promise.all([
    repositories.registry.findPlaceDetail(place.id),
    repositories.registry.listPlaceIndicators(place.id),
  ]);
  if (!detail) notFound();
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
        <Link href="/compare">Compare this place</Link>
      </nav>
      <details className="provenance">
        <summary>Sources and methodology</summary>
        <p>Metroplist keeps source releases, reference years, evidence status and calculation lineage with each published measurement.</p>
      </details>
    </main>
  );
}
