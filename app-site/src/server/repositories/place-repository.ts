import type { Geography, Place } from "@/modules/geography";

export interface PlaceRepository {
  findPlaceById(id: string): Promise<Place | null>;
  findPlaceBySlug(slug: string): Promise<Place | null>;
  findPlaceByOfficialIdentifier(authority: string, scheme: string, identifier: string): Promise<Place | null>;
  searchPlaces(query: string, limit: number): Promise<Place[]>;
  listGeographiesForPlace(placeId: string): Promise<Geography[]>;
}
