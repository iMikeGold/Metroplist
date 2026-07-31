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
  getCoverage(): Promise<CoverageSummary>;
}
