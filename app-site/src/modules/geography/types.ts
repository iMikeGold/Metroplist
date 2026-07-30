export const PLACE_KINDS = [
  "country",
  "territory",
  "region",
  "county",
  "municipality",
  "city",
  "metropolitan_area",
  "borough",
  "district",
  "ward",
  "neighbourhood",
  "postcode_area",
  "statistical_area",
  "historical_settlement",
  "former_administrative_area",
  "special_geographic_entity",
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number];

export interface Place {
  id: string;
  slug: string;
  canonicalName: string;
  placeKind: PlaceKind;
  countryCode: string | null;
  parentPlaceId: string | null;
  status: "current" | "historical" | "proposed" | "disputed";
  validFrom: string | null;
  validTo: string | null;
}

export interface Geography {
  id: string;
  placeId: string;
  geographyType: string;
  administrativeLevel: string | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface BoundaryVersion {
  id: string;
  geographyId: string;
  referenceDate: string | null;
  referenceYear: number | null;
  landAreaKm2: number | null;
  totalAreaKm2: number | null;
  sourceReleaseId: string | null;
  geometryObjectKey: string | null;
}
