import { calculateDirectionalComparison, createCanonicalComparisonKey } from "@/modules/comparisons";
import type { DensityReadRepository } from "@/server/repositories";

export async function getDensityEvidence(slug: string, repository: DensityReadRepository, referenceYear?: number) {
  return repository.findDensityBySlug(slug, referenceYear);
}

export async function compareDensityEvidence(originSlug: string, targetSlug: string, repository: DensityReadRepository, referenceYear?: number) {
  const [origin, target] = await Promise.all([
    repository.findDensityBySlug(originSlug, referenceYear),
    repository.findDensityBySlug(targetSlug, referenceYear),
  ]);
  if (!origin || !target) return { status: "verified_data_not_available" as const };
  const compatible = origin.geographyType === target.geographyType && origin.administrativeLevel === target.administrativeLevel && origin.referenceYear === target.referenceYear;
  if (!compatible) return { status: "not_comparable" as const, origin, target };
  return {
    status: "ok" as const, origin, target, comparisonMode: "like_for_like" as const,
    directional: calculateDirectionalComparison(origin.density, target.density),
    canonicalComparisonKey: createCanonicalComparisonKey({ indicatorId: "ind_population_density_km2", placeAId: origin.id, placeBId: target.id, observationAId: origin.densityObservationId, observationBId: target.densityObservationId }),
  };
}
