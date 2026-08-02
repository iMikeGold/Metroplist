import { assessEvidenceCompatibility, calculateDirectionalComparison } from "@/modules/comparisons";
import { publishableIndicator } from "@/modules/indicators/publication";
import { publicPlaceType } from "@/modules/places/presentation";
import {
  comparisonSummary,
  contentHash,
  placeProfileSummary,
  snapshotManifestSchema,
  type CreateSnapshotRequest,
  type SnapshotBlock,
  type SnapshotManifest,
  type SnapshotObservation,
} from "@/modules/publications";
import { siteConfig } from "@/config/site";
import type {
  PlaceDetail,
  PlaceIndicatorEvidence,
  PublicationReference,
  PublicationRepository,
  RegistryReadRepository,
} from "@/server/repositories";

const PUBLIC_SLUG_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function publicSlug(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(
    bytes,
    (byte) => PUBLIC_SLUG_ALPHABET[byte % PUBLIC_SLUG_ALPHABET.length],
  ).join("");
}

function placeManifest(place: PlaceDetail) {
  return {
    id: place.id,
    slug: place.slug,
    name: place.canonicalName,
    placeType: publicPlaceType(place.geographyTypes, place.placeKind),
    parentName: place.parentName,
  };
}

function observationManifest(
  placeId: string,
  evidence: PlaceIndicatorEvidence,
): SnapshotObservation {
  if (evidence.value == null) {
    throw new SnapshotValidationError(
      `Observation ${evidence.observationId} has no numeric value.`,
    );
  }
  return {
    observationId: evidence.observationId,
    placeId,
    indicatorId: evidence.indicatorId ?? evidence.indicatorCode,
    indicatorCode: evidence.indicatorCode,
    indicatorName: evidence.indicatorName,
    value: evidence.value,
    unit: evidence.unit,
    referenceYear: evidence.referenceYear,
    referencePeriodStart: evidence.referencePeriodStart,
    referencePeriodEnd: evidence.referencePeriodEnd,
    evidenceStatus: evidence.observationStatus,
    methodologyVersion: evidence.methodologyVersion,
    sourceReleaseId: evidence.sourceReleaseId,
    geographyType: evidence.geographyType,
    calculationIds: evidence.calculationIds ?? [],
  };
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

export class SnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotValidationError";
  }
}

function uniqueReferences(
  candidates: PublicationReference[],
): PublicationReference[] {
  const seen = new Set<string>();
  const references: PublicationReference[] = [];
  for (const candidate of candidates) {
    const key = [
      candidate.referenceType,
      candidate.referenceId,
      candidate.referenceRole,
    ].join("\u001f");
    if (seen.has(key)) continue;
    seen.add(key);
    references.push({ ...candidate, ordinal: references.length });
  }
  return references;
}

export function buildPublicationReferences(
  manifest: SnapshotManifest,
): PublicationReference[] {
  let ordinal = 0;
  const output: PublicationReference[] = [];
  for (const place of manifest.places) {
    output.push({
      referenceType: "place",
      referenceId: place.id,
      referenceRole: "subject",
      ordinal: ordinal++,
    });
  }
  for (const observation of manifest.observations) {
    output.push({
      referenceType: "observation",
      referenceId: observation.observationId,
      referenceRole: "published_evidence",
      ordinal: ordinal++,
    });
    output.push({
      referenceType: "indicator",
      referenceId: observation.indicatorId,
      referenceRole: "published_indicator",
      ordinal: ordinal++,
    });
  }
  for (const calculationId of manifest.calculationReferences) {
    output.push({
      referenceType: "calculation",
      referenceId: calculationId,
      referenceRole: "derivation",
      ordinal: ordinal++,
    });
  }
  for (const sourceReleaseId of manifest.sourceReferences) {
    output.push({
      referenceType: "source_release",
      referenceId: sourceReleaseId,
      referenceRole: "provenance",
      ordinal: ordinal++,
    });
  }
  return uniqueReferences(output);
}

async function loadSelection(
  request: CreateSnapshotRequest,
  registry: RegistryReadRepository,
) {
  const places = await Promise.all(
    request.placeIds.map((placeId) => registry.findPlaceDetail(placeId)),
  );
  if (places.some((place) => !place)) {
    throw new SnapshotValidationError("One or more selected places no longer exist.");
  }
  const resolvedPlaces = places as PlaceDetail[];
  const histories = await Promise.all(
    resolvedPlaces.map((place) => registry.listPlaceIndicatorEvidence(place.id)),
  );
  const requested = new Set(request.observationIds);
  const selected = histories.flatMap((history, placeIndex) =>
    history
      .filter((evidence) => requested.has(evidence.observationId))
      .map((evidence) => ({
        placeId: resolvedPlaces[placeIndex].id,
        evidence,
      })),
  );
  if (selected.length !== requested.size) {
    throw new SnapshotValidationError(
      "A selected observation does not belong to the selected places.",
    );
  }
  for (const selection of selected) {
    if (!publishableIndicator(selection.evidence.indicatorCode)) {
      throw new SnapshotValidationError(
        `${selection.evidence.indicatorName} is not approved for publication.`,
      );
    }
  }
  return { places: resolvedPlaces, selected };
}

export async function buildSnapshotManifest(
  request: CreateSnapshotRequest,
  registry: RegistryReadRepository,
  createdAt = new Date().toISOString(),
): Promise<SnapshotManifest> {
  if (
    (request.snapshotType === "place_profile" && request.placeIds.length !== 1) ||
    (request.snapshotType === "comparison" && request.placeIds.length !== 2)
  ) {
    throw new SnapshotValidationError(
      "Snapshot type and selected place count do not match.",
    );
  }
  const { places, selected } = await loadSelection(request, registry);
  const observations = selected.map(({ placeId, evidence }) =>
    observationManifest(placeId, evidence),
  );
  const manifestPlaces = places.map(placeManifest);
  const blocks: SnapshotBlock[] = [];
  let title: string;
  let summary: string;

  if (request.snapshotType === "place_profile") {
    title = `${manifestPlaces[0].name} place profile`;
    summary = placeProfileSummary(manifestPlaces[0], observations[0]);
    blocks.push(
      { id: "headline", type: "headline", text: title },
      { id: "summary", type: "narrative", text: summary },
      {
        id: "metrics",
        type: "metric_group",
        title: "Selected measurements",
        observationIds: observations.map((observation) => observation.observationId),
      },
    );
  } else {
    const originObservations = observations.filter(
      (observation) => observation.placeId === places[0].id,
    );
    const targetObservations = observations.filter(
      (observation) => observation.placeId === places[1].id,
    );
    if (!originObservations.length || !targetObservations.length) {
      throw new SnapshotValidationError(
        "Comparison Snapshots require complete compatible evidence pairs.",
      );
    }
    const pairs = originObservations.map((origin) => {
      const target = targetObservations.find(
        (candidate) =>
          candidate.indicatorCode === origin.indicatorCode &&
          candidate.unit === origin.unit &&
          candidate.referenceYear === origin.referenceYear &&
          candidate.methodologyVersion === origin.methodologyVersion &&
          candidate.evidenceStatus === origin.evidenceStatus,
      );
      if (!target) {
        throw new SnapshotValidationError(
          `No compatible target evidence was selected for ${origin.indicatorName}.`,
        );
      }
      const compatibility = assessEvidenceCompatibility(
        {
          ...origin,
          estimate: origin.evidenceStatus === "estimate",
          qualityStatus: "verified",
          preferredStatus: "preferred",
          observationStatus: origin.evidenceStatus,
          geographyId: "",
        },
        {
          ...target,
          estimate: target.evidenceStatus === "estimate",
          qualityStatus: "verified",
          preferredStatus: "preferred",
          observationStatus: target.evidenceStatus,
          geographyId: "",
        },
      );
      if (compatibility.length) {
        throw new SnapshotValidationError(
          compatibility.map((issue) => issue.message).join(" "),
        );
      }
      return { origin, target };
    });
    if (pairs.length === 0 || pairs.length !== targetObservations.length) {
      throw new SnapshotValidationError(
        "Comparison Snapshots require complete compatible evidence pairs.",
      );
    }
    title = `${manifestPlaces[0].name} and ${manifestPlaces[1].name}`;
    summary = comparisonSummary(
      manifestPlaces[0],
      manifestPlaces[1],
      pairs[0].origin,
      pairs[0].target,
    );
    blocks.push(
      { id: "headline", type: "headline", text: title },
      { id: "summary", type: "narrative", text: summary },
      {
        id: "metrics",
        type: "metric_group",
        title: "Selected comparison",
        observationIds: observations.map((observation) => observation.observationId),
      },
    );
    for (const [index, pair] of pairs.entries()) {
      const directional = calculateDirectionalComparison(
        pair.origin.value,
        pair.target.value,
      );
      blocks.push(
        {
          id: `difference-${index}`,
          type: "difference",
          originObservationId: pair.origin.observationId,
          targetObservationId: pair.target.observationId,
          absoluteDifference: directional.absoluteDifference,
          unit: pair.origin.unit,
        },
        {
          id: `ratio-${index}`,
          type: "ratio",
          originObservationId: pair.origin.observationId,
          targetObservationId: pair.target.observationId,
          ratio: directional.ratioOriginToTarget,
        },
      );
    }
  }

  if (request.contentMode === "map_and_figures") {
    blocks.push({
      id: "map",
      type: "map",
      placeIds: manifestPlaces.map((place) => place.id),
    });
  }
  if (request.contentMode === "data_table") {
    blocks.push({
      id: "table",
      type: "table",
      columns: ["Place", "Indicator", "Value", "Unit", "Year", "Status"],
      rows: observations.map((observation) => [
        manifestPlaces.find((place) => place.id === observation.placeId)?.name ?? "",
        observation.indicatorName,
        String(observation.value),
        observation.unit,
        observation.referenceYear == null ? "" : String(observation.referenceYear),
        observation.evidenceStatus,
      ]),
    });
  }

  const calculationReferences = unique(
    observations.flatMap((observation) => observation.calculationIds),
  );
  const sourceReferences = unique(
    observations.map((observation) => observation.sourceReleaseId),
  );
  const methodologyReferences = unique(
    observations.map((observation) => observation.methodologyVersion),
  );
  const statusText = unique(
    observations.map((observation) => observation.evidenceStatus),
  ).join(" and ");
  return snapshotManifestSchema.parse({
    schemaVersion: 1,
    snapshotType: request.snapshotType,
    createdAt,
    title,
    summary,
    places: manifestPlaces,
    blocks,
    observations,
    calculationReferences,
    sourceReferences,
    methodologyReferences,
    presentation: {
      contentMode: request.contentMode,
      preferredVariant: request.preferredVariant,
      selectedIndicatorCodes: unique(
        observations.map((observation) => observation.indicatorCode),
      ),
    },
    alternativeText: `${title}. ${summary} Evidence status: ${statusText}.`,
    licenceContext: {
      summary:
        "Source data retain publisher terms; Metroplist calculations and publication design are identified separately.",
      sourceTermsRequired: true,
    },
  });
}

export async function createSnapshot(
  request: CreateSnapshotRequest,
  registry: RegistryReadRepository,
  publications: PublicationRepository,
) {
  const manifest = await buildSnapshotManifest(request, registry);
  const hash = await contentHash({ ...manifest, createdAt: null });
  const existing = await publications.findByContentHash(hash);
  if (existing) return { snapshot: existing, deduplicated: true };
  const slug = publicSlug();
  return publications.create({
    id: `snapshot_${crypto.randomUUID()}`,
    publicSlug: slug,
    manifest,
    contentHash: hash,
    canonicalUrl: `${siteConfig.applicationUrl}/snapshot/${slug}`,
    references: buildPublicationReferences(manifest),
  });
}
