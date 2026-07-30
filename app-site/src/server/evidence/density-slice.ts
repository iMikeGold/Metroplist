import { calculateDirectionalComparison, createCanonicalComparisonKey } from "@/modules/comparisons";

// Temporary Release 0.1 runtime fixture. The SQL evidence seed is canonical.
// tests/evidence/seed-runtime-drift.test.ts prevents these values and IDs from
// drifting until Release 0.2 connects pages to repository-backed D1 reads.

export const evidenceSources = {
  population: { publisher: "Office for National Statistics", dataset: "TS001: Number of usual residents in households and communal establishments", release: "Census 2021, version 3", releaseDate: "2023-01-30", retrievedAt: "2026-07-31", sourceUrl: "https://www.ons.gov.uk/datasets/TS001/editions/2021/versions/3" },
  area: { publisher: "Office for National Statistics", dataset: "Standard Area Measurements for 2021 Statistical Geographies", release: "March 2021 in England and Wales, V2", releaseDate: "2022-08-11", retrievedAt: "2026-07-31", sourceUrl: "https://www.data.gov.uk/dataset/37333f2d-e2c8-4c7d-888d-194119b65df0/standard-area-measurements-for-2021-statistical-geographies-march-2021-in-ew-v2" },
} as const;

export interface DensityEvidence {
  id: string; slug: string; name: string; officialCode: string; geographyId: string;
  geographyType: "London borough"; administrativeLevel: "lower-tier local authority";
  country: "England"; region: "Greater London"; referenceYear: 2021; boundaryVersion: string;
  population: number; landAreaKm2: number; density: number; populationObservationId: string;
  householdPopulation: number; communalPopulation: number; areaObservationId: string;
  densityObservationId: string; populationCalculationId: string; calculationId: string;
}

function place(input: Omit<DensityEvidence, "density">): DensityEvidence { return { ...input, density: input.population / input.landAreaKm2 }; }
export const densityEvidence: Record<string, DensityEvidence> = {
  greenwich: place({ id: "place_greenwich_royal_borough", slug: "greenwich", name: "Royal Borough of Greenwich", officialCode: "E09000011", geographyId: "geo_greenwich_ltla_2021", geographyType: "London borough", administrativeLevel: "lower-tier local authority", country: "England", region: "Greater London", referenceYear: 2021, boundaryVersion: "Census 2021 statistical geography (21 March 2021)", householdPopulation: 284650, communalPopulation: 4418, population: 289068, landAreaKm2: 47.3213, populationObservationId: "obs_greenwich_pop_2021", areaObservationId: "obs_greenwich_land_2021", densityObservationId: "obs_greenwich_density_2021", populationCalculationId: "calc_greenwich_pop_total_2021", calculationId: "calc_greenwich_density_2021" }),
  bromley: place({ id: "place_bromley_london_borough", slug: "bromley", name: "London Borough of Bromley", officialCode: "E09000006", geographyId: "geo_bromley_ltla_2021", geographyType: "London borough", administrativeLevel: "lower-tier local authority", country: "England", region: "Greater London", referenceYear: 2021, boundaryVersion: "Census 2021 statistical geography (21 March 2021)", householdPopulation: 328202, communalPopulation: 1790, population: 329992, landAreaKm2: 150.1562, populationObservationId: "obs_bromley_pop_2021", areaObservationId: "obs_bromley_land_2021", densityObservationId: "obs_bromley_density_2021", populationCalculationId: "calc_bromley_pop_total_2021", calculationId: "calc_bromley_density_2021" }),
};

export function getDensity(slug: string) { return densityEvidence[slug] ?? null; }
export function compareEvidence(originSlug: string, targetSlug: string) {
  const origin = getDensity(originSlug); const target = getDensity(targetSlug);
  if (!origin || !target) return { status: "verified_data_not_available" as const };
  const directional = calculateDirectionalComparison(origin.density, target.density);
  return { status: "ok" as const, origin, target, directional, comparisonMode: "like_for_like" as const,
    canonicalComparisonKey: createCanonicalComparisonKey({ indicatorId: "ind_population_density_km2", placeAId: origin.id, placeBId: target.id, observationAId: origin.densityObservationId, observationBId: target.densityObservationId }) };
}
