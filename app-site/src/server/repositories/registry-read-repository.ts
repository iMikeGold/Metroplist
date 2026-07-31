export interface PlaceSearchQuery {
  query: string;
  limit?: number;
  countryCode?: string;
  geographyType?: string;
}

export interface PlaceSearchResult {
  id: string;
  slug: string;
  canonicalName: string;
  placeKind: string;
  status: string;
  countryCode: string | null;
  parentPlaceId: string | null;
  parentName: string | null;
  geographyTypes: string[];
  matchedBy: "slug" | "identifier" | "canonical_name" | "alias";
  matchedValue: string;
  matchClass: "exact" | "prefix";
  ambiguous: boolean;
}

export interface PlaceDetail extends PlaceSearchResult {
  aliases: string[];
  identifiers: Array<{
    authority: string;
    scheme: string;
    identifier: string;
  }>;
  centroid: { latitude: number; longitude: number } | null;
}

export interface PlaceIndicatorSummary {
  id: string;
  code: string;
  canonicalName: string;
  unit: string;
  observationCount: number;
  firstYear: number | null;
  lastYear: number | null;
  latestValue: number | null;
  latestYear: number | null;
  estimate: boolean;
  methodologyVersion: string | null;
  qualityStatus: string;
  preferredStatus: string;
  observationStatus: "reported" | "estimate" | "projection" | "awaiting_review";
  sourceReleaseId: string | null;
}

export interface PlaceIndicatorEvidence {
  observationId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  value: number | null;
  referenceYear: number | null;
  referencePeriodStart: string | null;
  referencePeriodEnd: string | null;
  methodologyVersion: string | null;
  qualityStatus: string;
  preferredStatus: string;
  estimate: boolean;
  observationStatus: "reported" | "estimate" | "projection" | "awaiting_review";
  sourceReleaseId: string | null;
  geographyId: string;
  geographyType: string;
}

export interface CoverageSummary {
  places: number;
  m49CountriesOrAreas: number;
  populationLocations: number;
  populationObservations: number;
  capitalRelationships: number;
  firstPopulationYear: number | null;
  lastPopulationYear: number | null;
}

export interface RegistryReadRepository {
  searchPlaces(query: PlaceSearchQuery): Promise<PlaceSearchResult[]>;
  findPlaceDetail(placeId: string): Promise<PlaceDetail | null>;
  listPlaceIndicators(placeId: string): Promise<PlaceIndicatorSummary[]>;
  listPlaceIndicatorEvidence(placeId: string): Promise<PlaceIndicatorEvidence[]>;
  getCoverage(): Promise<CoverageSummary>;
}
