import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Provenance } from "@/components/provenance";
import { getRuntimeRepositories } from "@/server/database";
import { getDensityEvidence } from "@/server/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ placeSlug: string }>;
}): Promise<Metadata> {
  const { placeSlug } = await params;
  const { density } = await getRuntimeRepositories();
  const place = await getDensityEvidence(placeSlug, density);
  return {
    title: place ? `${place.name} Population Density` : "Population Density",
  };
}

export default async function DensityPage({
  params,
}: {
  params: Promise<{ placeSlug: string }>;
}) {
  const { placeSlug } = await params;
  const { density } = await getRuntimeRepositories();
  const place = await getDensityEvidence(placeSlug, density);
  if (!place) notFound();
  const reportParameters = new URLSearchParams({
    page: `https://app.metroplist.com/density/${place.slug}`,
    place_ids: place.id,
    observation_ids: [
      place.householdObservationId,
      place.communalObservationId,
      place.populationObservationId,
      place.areaObservationId,
      place.densityObservationId,
    ].join(","),
    calculation_ids: [
      place.populationCalculationId,
      place.densityCalculationId,
    ].join(","),
  });
  return (
    <main>
      <p className="eyebrow">Population density · 2021</p>
      <h1>{place.name}</h1>
      <p className="lede">
        A canonical London borough record, resolved by ONS code {place.officialCode}.
      </p>
      <section className="metrics">
        <div><span>Population</span><strong>{place.population.toLocaleString("en-GB")}</strong></div>
        <div><span>Land area</span><strong>{place.landAreaKm2.toFixed(4)} km²</strong></div>
        <div><span>Calculated density</span><strong>{place.density.toFixed(1)} people/km²</strong></div>
      </section>
      <section className="details">
        <h2>Geographic definition</h2>
        <dl>
          <dt>Area type</dt><dd>{place.geographyType}</dd>
          <dt>Administrative level</dt><dd>{place.administrativeLevel}</dd>
          <dt>Country</dt><dd>{place.country}</dd>
          <dt>Region</dt><dd>{place.region}</dd>
          <dt>Reference period</dt><dd>Census Day, 21 March {place.referenceYear}</dd>
          <dt>Boundary version</dt><dd>{place.boundaryVersion}</dd>
          <dt>Calculation status</dt><dd>Verified inputs; Metroplist-derived output</dd>
        </dl>
      </section>
      <Provenance evidence={place} />
      <nav className="record-actions">
        <Link href="/compare">Compare with another place</Link>
        <Link href={`/report-data-issue?${reportParameters}`}>Report a data issue</Link>
      </nav>
    </main>
  );
}
