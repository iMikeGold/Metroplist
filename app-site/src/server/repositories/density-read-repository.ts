export interface DensityPlaceReadModel {
  id: string;
  slug: string;
  name: string;
  officialCode: string;
  geographyId: string;
  geographyType: string;
  administrativeLevel: string | null;
  country: string;
  region: string;
  referenceYear: number;
  boundaryVersion: string;
  householdPopulation: number;
  communalPopulation: number;
  population: number;
  landAreaKm2: number;
  density: number;
  householdObservationId: string;
  communalObservationId: string;
  populationObservationId: string;
  areaObservationId: string;
  densityObservationId: string;
  populationCalculationId: string;
  densityCalculationId: string;
  populationSourceUrl: string;
  populationRelease: string;
  areaSourceUrl: string;
  areaRelease: string;
}

export interface DensityReadRepository {
  findDensityBySlug(slug: string, referenceYear?: number): Promise<DensityPlaceReadModel | null>;
}
