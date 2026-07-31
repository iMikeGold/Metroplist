import type { Metadata } from "next";
import Link from "next/link";
import { getRuntimeRepositories } from "@/server/database";
import {
  compareSelectedEvidence,
} from "@/server/services";
import { formatMeasure, publicPlaceType } from "@/modules/places/presentation";

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
            <strong>{formatMeasure(origin.value, origin.unit)}</strong>
          </div>
          <div>
            <span>{targetPlace.canonicalName}</span>
            <strong>{formatMeasure(target.value, target.unit)}</strong>
          </div>
          <div>
            <span>Absolute difference</span>
            <strong>
              {formatMeasure(directional.absoluteDifference, origin.unit)}
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
            <dt>Place types</dt>
            <dd>{publicPlaceType([origin.geographyType], origin.geographyType)} and {publicPlaceType([target.geographyType], target.geographyType)}</dd>
            <dt>Source releases</dt>
            <dd>
              {origin.sourceReleaseId ?? "Derived observation"} and{" "}
              {target.sourceReleaseId ?? "Derived observation"}
            </dd>
          </dl>
          <details>
            <summary>Technical evidence details</summary>
            <p><code>{origin.observationId}</code> · <code>{target.observationId}</code></p>
            <p className="machine-value"><code>{result.canonicalComparisonKey}</code></p>
          </details>
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

  return (
    <UnavailableComparison message="Choose the exact places and indicator in Compare so Metroplist can preserve the selected evidence frame." />
  );
}
