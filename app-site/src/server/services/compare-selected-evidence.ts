import {
  assessEvidenceCompatibility,
  calculateDirectionalComparison,
  createCanonicalComparisonKey,
} from "@/modules/comparisons";
import type { RegistryReadRepository } from "@/server/repositories";

export async function compareSelectedEvidence(
  originSlug: string,
  targetSlug: string,
  originObservationId: string,
  targetObservationId: string,
  repository: RegistryReadRepository,
) {
  const [originCandidates, targetCandidates] = await Promise.all([
    repository.searchPlaces({ query: originSlug, limit: 25 }),
    repository.searchPlaces({ query: targetSlug, limit: 25 }),
  ]);
  const originPlace = originCandidates.find((place) => place.slug === originSlug);
  const targetPlace = targetCandidates.find((place) => place.slug === targetSlug);
  if (!originPlace || !targetPlace) {
    return { status: "place_not_found" as const };
  }
  const [originEvidence, targetEvidence] = await Promise.all([
    repository.listPlaceIndicatorEvidence(originPlace.id),
    repository.listPlaceIndicatorEvidence(targetPlace.id),
  ]);
  const origin = originEvidence.find(
    (evidence) => evidence.observationId === originObservationId,
  );
  const target = targetEvidence.find(
    (evidence) => evidence.observationId === targetObservationId,
  );
  if (!origin || !target || origin.value == null || target.value == null) {
    return { status: "evidence_not_found" as const };
  }
  const issues = assessEvidenceCompatibility(origin, target);
  if (issues.length > 0) {
    return { status: "not_comparable" as const, issues };
  }
  return {
    status: "ok" as const,
    originPlace,
    targetPlace,
    origin,
    target,
    directional: calculateDirectionalComparison(origin.value, target.value),
    canonicalComparisonKey: createCanonicalComparisonKey({
      indicatorId: origin.indicatorCode,
      placeAId: originPlace.id,
      placeBId: targetPlace.id,
      observationAId: origin.observationId,
      observationBId: target.observationId,
    }),
  };
}
