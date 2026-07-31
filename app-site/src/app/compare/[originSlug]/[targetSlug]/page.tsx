import type { Metadata } from "next";
import Link from "next/link";
import { getRuntimeRepositories } from "@/server/database";
import {
  compareDensityEvidence,
  compareSelectedEvidence,
} from "@/server/services";

interface RouteParams {
  originSlug: string;
  targetSlug: string;
}

interface ComparisonSearchParams {
  originObservationId?: string;
  targetObservationId?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { originSlug, targetSlug } = await params;
  const { places } = await getRuntimeRepositories();
  const [origin, target] = await Promise.all([
    places.findPlaceBySlug(originSlug),
    places.findPlaceBySlug(targetSlug),
  ]);
  return {
    title:
      origin && target
        ? `${origin.canonicalName} and ${target.canonicalName} Comparison`
        : "Place Comparison",
  };
}

function UnavailableComparison({ message }: { message?: string }) {
  return (
    <main>
      <h1>Verified data unavailable</h1>
      <p>
        {message ??
          "Metroplist recognises this request but does not yet hold a verified result."}
      </p>
    </main>
  );
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<ComparisonSearchParams>;
}) {
  const { originSlug, targetSlug } = await params;
  const selected = await searchParams;
  const hasOriginSelection = Boolean(selected.originObservationId);
  const hasTargetSelection = Boolean(selected.targetObservationId);
  const repositories = await getRuntimeRepositories();

  if (hasOriginSelection || hasTargetSelection) {
    if (!selected.originObservationId || !selected.targetObservationId) {
      return (
        <UnavailableComparison message="Both selected observation IDs are required." />
      );
    }
    const result = await compareSelectedEvidence(
      originSlug,
      targetSlug,
      selected.originObservationId,
      selected.targetObservationId,
      repositories.registry,
    );
    if (result.status !== "ok") {
      const reason =
        result.status === "not_comparable"
          ? result.issues.map((issue) => issue.message).join(" ")
          : "The selected evidence no longer exists for these places.";
      return <UnavailableComparison message={reason} />;
    }
    const { originPlace, targetPlace, origin, target, directional } = result;
    return (
      <main>
        <p className="eyebrow">
          {origin.indicatorName} · {origin.referenceYear}
        </p>
        <h1>
          {originPlace.canonicalName} to {targetPlace.canonicalName}
        </h1>
        <p className="lede">
          {originPlace.canonicalName} has{" "}
          {directional.ratioOriginToTarget.toFixed(2)} times the{" "}
          {origin.indicatorName.toLowerCase()} of {targetPlace.canonicalName}.
        </p>
        <section className="metrics">
          <div>
            <span>{originPlace.canonicalName}</span>
            <strong>{origin.value?.toLocaleString()} {origin.unit}</strong>
          </div>
          <div>
            <span>{targetPlace.canonicalName}</span>
            <strong>{target.value?.toLocaleString()} {target.unit}</strong>
          </div>
          <div>
            <span>Absolute difference</span>
            <strong>
              {directional.absoluteDifference.toLocaleString()} {origin.unit}
            </strong>
          </div>
        </section>
        <section className="details">
          <h2>Comparison frame</h2>
          <dl>
            <dt>Reference year</dt>
            <dd>{origin.referenceYear}</dd>
            <dt>Methodology</dt>
            <dd>{origin.methodologyVersion ?? "Declared source methodology"}</dd>
            <dt>Evidence status</dt>
            <dd>{origin.observationStatus}</dd>
            <dt>Geographies</dt>
            <dd>{origin.geographyType} and {target.geographyType}</dd>
            <dt>Source releases</dt>
            <dd>
              {origin.sourceReleaseId ?? "Derived observation"} and{" "}
              {target.sourceReleaseId ?? "Derived observation"}
            </dd>
            <dt>Observation IDs</dt>
            <dd>
              <code>{origin.observationId}</code> ·{" "}
              <code>{target.observationId}</code>
            </dd>
            <dt>Evidence identity</dt>
            <dd><code>{result.canonicalComparisonKey}</code></dd>
          </dl>
        </section>
        <nav>
          <Link
            href={`/compare/${targetPlace.slug}/${originPlace.slug}?originObservationId=${encodeURIComponent(target.observationId)}&targetObservationId=${encodeURIComponent(origin.observationId)}`}
          >
            Reverse comparison
          </Link>
        </nav>
      </main>
    );
  }

  const result = await compareDensityEvidence(
    originSlug,
    targetSlug,
    repositories.density,
  );
  if (result.status !== "ok") return <UnavailableComparison />;
  const { origin, target, directional } = result;
  return (
    <main>
      <p className="eyebrow">Density comparison · {origin.referenceYear}</p>
      <h1>{origin.name} to {target.name}</h1>
      <p className="lede">
        {origin.name} has {directional.ratioOriginToTarget.toFixed(2)} times the
        population density of {target.name}.
      </p>
      <section className="metrics">
        <div><span>{origin.name}</span><strong>{origin.density.toFixed(1)}</strong></div>
        <div><span>{target.name}</span><strong>{target.density.toFixed(1)}</strong></div>
        <div>
          <span>Absolute difference</span>
          <strong>{directional.absoluteDifference.toFixed(1)} people/km²</strong>
        </div>
      </section>
      <section className="details">
        <h2>Comparison frame</h2>
        <dl>
          <dt>Percentage relationship</dt>
          <dd>{target.name} is {directional.targetAsPercentOfOrigin.toFixed(1)}% of {origin.name}</dd>
          <dt>Mode</dt>
          <dd>{result.comparisonMode.replaceAll("_", " ")}</dd>
          <dt>Reference periods</dt>
          <dd>21 March 2021 for both places</dd>
          <dt>Geographies</dt>
          <dd>{origin.geographyType} and {target.geographyType}</dd>
          <dt>Evidence identity</dt>
          <dd><code>{result.canonicalComparisonKey}</code></dd>
        </dl>
      </section>
      <p>
        Each density is calculated by Metroplist from a Metroplist-derived
        population total, its official ONS TS001 component observations, and an
        official ONS 2021 land-area observation. It is not an ONS-published density.
      </p>
      <nav>
        <Link href={`/compare/${target.slug}/${origin.slug}`}>Reverse comparison</Link>
        {" · "}
        <Link href={`/density/${origin.slug}`}>View {origin.name}</Link>
      </nav>
    </main>
  );
}
