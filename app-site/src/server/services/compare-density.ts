import {
  assessComparisonMode,
  calculateDirectionalComparison,
  createCanonicalComparisonKey,
} from "@/modules/comparisons";
import { selectPreferredObservation } from "@/modules/timelines";
import type {
  ObservationRepository,
  PlaceRepository,
} from "@/server/repositories";

const POPULATION_DENSITY_INDICATOR_ID = "ind_population_density_km2";

export interface CompareDensityInput {
  originSlug: string;
  targetSlug: string;
  referenceYear?: number;
}

export async function compareDensity(
  input: CompareDensityInput,
  dependencies: {
    places: PlaceRepository;
    observations: ObservationRepository;
  },
) {
  const [origin, target] = await Promise.all([
    dependencies.places.findPlaceBySlug(input.originSlug),
    dependencies.places.findPlaceBySlug(input.targetSlug),
  ]);

  if (!origin || !target) {
    return { status: "place_not_found" as const };
  }

  const [originGeographies, targetGeographies] = await Promise.all([
    dependencies.places.listGeographiesForPlace(origin.id),
    dependencies.places.listGeographiesForPlace(target.id),
  ]);

  const originGeography = originGeographies[0] ?? null;
  const targetGeography = targetGeographies[0] ?? null;

  if (!originGeography || !targetGeography) {
    return { status: "geography_not_available" as const };
  }

  const [originCandidates, targetCandidates] = await Promise.all([
    dependencies.observations.listObservations({
      geographyId: originGeography.id,
      indicatorId: POPULATION_DENSITY_INDICATOR_ID,
      referenceYear: input.referenceYear,
    }),
    dependencies.observations.listObservations({
      geographyId: targetGeography.id,
      indicatorId: POPULATION_DENSITY_INDICATOR_ID,
      referenceYear: input.referenceYear,
    }),
  ]);

  const originObservation = selectPreferredObservation(originCandidates);
  const targetObservation = selectPreferredObservation(targetCandidates);

  if (
    !originObservation ||
    !targetObservation ||
    originObservation.valueNumeric === null ||
    targetObservation.valueNumeric === null
  ) {
    return { status: "verified_data_not_available" as const };
  }

  const comparisonMode = assessComparisonMode({
    sameIndicator:
      originObservation.indicatorId === targetObservation.indicatorId,
    sameUnit: originObservation.unitId === targetObservation.unitId,
    sameGeographyType:
      originGeography.geographyType === targetGeography.geographyType,
    sameAdministrativeLevel:
      originGeography.administrativeLevel ===
      targetGeography.administrativeLevel,
    sameReferencePeriod:
      originObservation.referenceYear === targetObservation.referenceYear,
    containsHistoricalEntity:
      origin.status === "historical" || target.status === "historical",
  });

  if (comparisonMode === "not_comparable") {
    return { status: "not_comparable" as const };
  }

  return {
    status: "ok" as const,
    origin,
    target,
    originGeography,
    targetGeography,
    originObservation,
    targetObservation,
    comparisonMode,
    canonicalCacheKey: createCanonicalComparisonKey({
      indicatorId: POPULATION_DENSITY_INDICATOR_ID,
      placeAId: origin.id,
      placeBId: target.id,
      observationAId: originObservation.id,
      observationBId: targetObservation.id,
    }),
    directional: calculateDirectionalComparison(
      originObservation.valueNumeric,
      targetObservation.valueNumeric,
    ),
  };
}
