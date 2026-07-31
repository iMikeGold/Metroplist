import type { DensityPlaceReadModel, DensityReadRepository } from "@/server/repositories";

function place(input: Omit<DensityPlaceReadModel, "density">): DensityPlaceReadModel {
  return { ...input, density: input.population / input.landAreaKm2 };
}

export const densityFixture: Record<string, DensityPlaceReadModel> = {
  greenwich: place({ id: "place_greenwich_royal_borough", slug: "greenwich", name: "Royal Borough of Greenwich", officialCode: "E09000011", geographyId: "geo_greenwich_ltla_2021", geographyType: "London borough", administrativeLevel: "lower-tier local authority", country: "England", region: "Greater London", referenceYear: 2021, boundaryVersion: "Census 2021", householdPopulation: 284650, communalPopulation: 4418, population: 289068, landAreaKm2: 47.3213, householdObservationId: "obs_greenwich_household_pop_2021", communalObservationId: "obs_greenwich_communal_pop_2021", populationObservationId: "obs_greenwich_pop_2021", areaObservationId: "obs_greenwich_land_2021", densityObservationId: "obs_greenwich_density_2021", populationCalculationId: "calc_greenwich_pop_total_2021", densityCalculationId: "calc_greenwich_density_2021", populationSourceUrl: "https://example.test/pop", populationRelease: "2021 v3", areaSourceUrl: "https://example.test/area", areaRelease: "March 2021 V2" }),
  bromley: place({ id: "place_bromley_london_borough", slug: "bromley", name: "London Borough of Bromley", officialCode: "E09000006", geographyId: "geo_bromley_ltla_2021", geographyType: "London borough", administrativeLevel: "lower-tier local authority", country: "England", region: "Greater London", referenceYear: 2021, boundaryVersion: "Census 2021", householdPopulation: 328202, communalPopulation: 1790, population: 329992, landAreaKm2: 150.1562, householdObservationId: "obs_bromley_household_pop_2021", communalObservationId: "obs_bromley_communal_pop_2021", populationObservationId: "obs_bromley_pop_2021", areaObservationId: "obs_bromley_land_2021", densityObservationId: "obs_bromley_density_2021", populationCalculationId: "calc_bromley_pop_total_2021", densityCalculationId: "calc_bromley_density_2021", populationSourceUrl: "https://example.test/pop", populationRelease: "2021 v3", areaSourceUrl: "https://example.test/area", areaRelease: "March 2021 V2" }),
};

export class FixtureDensityRepository implements DensityReadRepository {
  async findDensityBySlug(slug: string) { return densityFixture[slug] ?? null; }
}
