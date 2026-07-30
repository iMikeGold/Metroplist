import type { D1DatabaseLike } from "@/server/database/types";
import type { PlaceRepository } from "@/server/repositories";
import { mapGeography, mapPlace } from "./mappers";

export class D1PlaceRepository implements PlaceRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async findPlaceById(id: string) { const row = await this.db.prepare("SELECT * FROM places WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>(); return row ? mapPlace(row) : null; }
  async findPlaceBySlug(slug: string) { const row = await this.db.prepare("SELECT * FROM places WHERE slug = ? LIMIT 1").bind(slug).first<Record<string, unknown>>(); return row ? mapPlace(row) : null; }
  async findPlaceByOfficialIdentifier(authority: string, scheme: string, identifier: string) { const row = await this.db.prepare("SELECT p.* FROM place_identifiers i JOIN places p ON p.id = i.place_id WHERE i.authority = ? AND i.scheme = ? AND i.identifier = ? ORDER BY i.valid_from DESC LIMIT 1").bind(authority, scheme, identifier).first<Record<string, unknown>>(); return row ? mapPlace(row) : null; }
  async searchPlaces(query: string, limit: number) { const boundedLimit = Math.max(1, Math.min(50, Math.trunc(limit))); const result = await this.db.prepare("SELECT * FROM places WHERE canonical_name LIKE ? COLLATE NOCASE UNION SELECT p.* FROM place_names n JOIN places p ON p.id = n.place_id WHERE n.name LIKE ? COLLATE NOCASE ORDER BY canonical_name LIMIT ?").bind(`${query}%`, `${query}%`, boundedLimit).all<Record<string, unknown>>(); return (result.results ?? []).map(mapPlace); }
  async listGeographiesForPlace(placeId: string) { const result = await this.db.prepare("SELECT * FROM geographies WHERE place_id = ? ORDER BY valid_from DESC").bind(placeId).all<Record<string, unknown>>(); return (result.results ?? []).map(mapGeography); }
}
