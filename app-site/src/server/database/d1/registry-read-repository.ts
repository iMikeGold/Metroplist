import type { D1DatabaseLike } from "@/server/database/types";
import type {
  CoverageSummary,
  PlaceDetail,
  PlaceIndicatorSummary,
  PlaceSearchQuery,
  PlaceSearchResult,
  RegistryReadRepository,
} from "@/server/repositories";

type Row = Record<string, unknown>;

function splitList(value: unknown): string[] {
  return value ? String(value).split("\u001f").filter(Boolean) : [];
}

function mapSearchResult(row: Row): PlaceSearchResult {
  return {
    id: String(row.id),
    slug: String(row.slug),
    canonicalName: String(row.canonical_name),
    placeKind: String(row.place_kind),
    status: String(row.status),
    countryCode: row.country_code ? String(row.country_code) : null,
    parentPlaceId: row.parent_place_id ? String(row.parent_place_id) : null,
    parentName: row.parent_name ? String(row.parent_name) : null,
    geographyTypes: splitList(row.geography_types),
    matchedBy: String(row.matched_by) as PlaceSearchResult["matchedBy"],
    ambiguous: Number(row.name_match_count) > 1,
  };
}

export class D1RegistryReadRepository implements RegistryReadRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async searchPlaces(input: PlaceSearchQuery): Promise<PlaceSearchResult[]> {
    const query = input.query.trim();
    if (!query) return [];
    const limit = Math.max(1, Math.min(25, Math.trunc(input.limit ?? 10)));
    const countryCode = input.countryCode?.trim().toUpperCase() || null;
    const geographyType = input.geographyType?.trim() || null;
    const sql = `
      WITH matches AS (
        SELECT id AS place_id, 0 AS rank, 'slug' AS matched_by FROM places WHERE slug = ? COLLATE NOCASE
        UNION ALL
        SELECT place_id, 1, 'identifier' FROM place_identifiers WHERE identifier = ? COLLATE NOCASE
        UNION ALL
        SELECT id, 2, 'canonical_name' FROM places WHERE canonical_name = ? COLLATE NOCASE
        UNION ALL
        SELECT place_id, 3, 'alias' FROM place_names WHERE name = ? COLLATE NOCASE
        UNION ALL
        SELECT id, 4, 'canonical_name' FROM places WHERE canonical_name LIKE ? COLLATE NOCASE
        UNION ALL
        SELECT place_id, 5, 'alias' FROM place_names WHERE name LIKE ? COLLATE NOCASE
      ),
      ranked AS (
        SELECT place_id, MIN(rank) AS rank,
          CASE MIN(rank)
            WHEN 0 THEN 'slug' WHEN 1 THEN 'identifier'
            WHEN 2 THEN 'canonical_name' ELSE 'alias'
          END AS matched_by
        FROM matches GROUP BY place_id
      )
      SELECT p.*, parent.canonical_name AS parent_name, r.matched_by,
        (SELECT COUNT(DISTINCT p2.id)
          FROM places p2 LEFT JOIN place_names n2 ON n2.place_id = p2.id
          WHERE p2.canonical_name = p.canonical_name COLLATE NOCASE
             OR n2.name = p.canonical_name COLLATE NOCASE) AS name_match_count,
        (SELECT GROUP_CONCAT(geography_type, char(31))
          FROM (SELECT DISTINCT geography_type
            FROM geographies WHERE place_id = p.id)) AS geography_types
      FROM ranked r
      JOIN places p ON p.id = r.place_id
      LEFT JOIN places parent ON parent.id = p.parent_place_id
      WHERE (? IS NULL OR p.country_code = ?)
        AND (? IS NULL OR EXISTS (
          SELECT 1 FROM geographies g
          WHERE g.place_id = p.id AND g.geography_type = ?
        ))
      ORDER BY r.rank, p.canonical_name COLLATE NOCASE, p.place_kind, p.id
      LIMIT ?`;
    const prefix = `${query}%`;
    const result = await this.db
      .prepare(sql)
      .bind(
        query,
        query,
        query,
        query,
        prefix,
        prefix,
        countryCode,
        countryCode,
        geographyType,
        geographyType,
        limit,
      )
      .all<Row>();
    return (result.results ?? []).map(mapSearchResult);
  }

  async findPlaceDetail(placeId: string): Promise<PlaceDetail | null> {
    const row = await this.db
      .prepare(`
        SELECT p.*, parent.canonical_name AS parent_name,
          'slug' AS matched_by, 1 AS name_match_count,
          (SELECT GROUP_CONCAT(geography_type, char(31))
            FROM (SELECT DISTINCT geography_type
              FROM geographies WHERE place_id = p.id)) AS geography_types,
          (SELECT GROUP_CONCAT(name, char(31))
            FROM place_names WHERE place_id = p.id AND is_primary = 0) AS aliases
        FROM places p LEFT JOIN places parent ON parent.id = p.parent_place_id
        WHERE p.id = ? LIMIT 1`)
      .bind(placeId)
      .first<Row>();
    if (!row) return null;
    const identifiers = await this.db
      .prepare(`
        SELECT authority, scheme, identifier FROM place_identifiers
        WHERE place_id = ? ORDER BY authority, scheme, identifier`)
      .bind(placeId)
      .all<Row>();
    return {
      ...mapSearchResult(row),
      aliases: splitList(row.aliases),
      identifiers: (identifiers.results ?? []).map((identifier) => ({
        authority: String(identifier.authority),
        scheme: String(identifier.scheme),
        identifier: String(identifier.identifier),
      })),
      centroid:
        row.centroid_latitude == null || row.centroid_longitude == null
          ? null
          : {
              latitude: Number(row.centroid_latitude),
              longitude: Number(row.centroid_longitude),
            },
    };
  }

  async listPlaceIndicators(placeId: string): Promise<PlaceIndicatorSummary[]> {
    const result = await this.db
      .prepare(`
        WITH place_observations AS (
          SELECT o.*, ROW_NUMBER() OVER (
            PARTITION BY o.indicator_id
            ORDER BY o.reference_year DESC, o.verified_at DESC, o.id
          ) AS latest_rank
          FROM observations o JOIN geographies g ON g.id = o.geography_id
          WHERE g.place_id = ?
            AND o.preferred_status = 'preferred'
            AND o.quality_status IN ('verified', 'qualified')
        )
        SELECT i.id, i.code, i.canonical_name, u.symbol,
          COUNT(*) AS observation_count,
          MIN(po.reference_year) AS first_year,
          MAX(po.reference_year) AS last_year,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.value_numeric END) AS latest_value,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.reference_year END) AS latest_year,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.is_estimate END) AS is_estimate
        FROM place_observations po
        JOIN indicators i ON i.id = po.indicator_id
        JOIN units u ON u.id = po.unit_id
        GROUP BY i.id, i.code, i.canonical_name, u.symbol
        ORDER BY i.canonical_name`)
      .bind(placeId)
      .all<Row>();
    return (result.results ?? []).map((row) => ({
      id: String(row.id),
      code: String(row.code),
      canonicalName: String(row.canonical_name),
      unit: String(row.symbol),
      observationCount: Number(row.observation_count),
      firstYear: row.first_year == null ? null : Number(row.first_year),
      lastYear: row.last_year == null ? null : Number(row.last_year),
      latestValue: row.latest_value == null ? null : Number(row.latest_value),
      latestYear: row.latest_year == null ? null : Number(row.latest_year),
      estimate: Number(row.is_estimate) === 1,
    }));
  }

  async getCoverage(): Promise<CoverageSummary> {
    const row = await this.db
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM places) AS places,
          (SELECT COUNT(*) FROM place_classifications
            WHERE classification_scheme = 'UN_M49_LEVEL'
              AND classification_code = 'country_or_area') AS m49_countries_or_areas,
          (SELECT COUNT(DISTINCT geography_id) FROM observations
            WHERE indicator_id = 'ind_wpp_population_thousands') AS population_locations,
          (SELECT COUNT(*) FROM observations
            WHERE indicator_id = 'ind_population_total'
              AND methodology_version = 'Metroplist WPP unit conversion v1') AS population_observations,
          (SELECT COUNT(*) FROM place_relationships
            WHERE relationship_type = 'current_capital_of') AS capital_relationships,
          (SELECT MIN(reference_year) FROM observations
            WHERE indicator_id = 'ind_wpp_population_thousands') AS first_population_year,
          (SELECT MAX(reference_year) FROM observations
            WHERE indicator_id = 'ind_wpp_population_thousands') AS last_population_year`)
      .first<Row>();
    if (!row) throw new Error("Coverage query returned no result");
    return {
      places: Number(row.places),
      m49CountriesOrAreas: Number(row.m49_countries_or_areas),
      populationLocations: Number(row.population_locations),
      populationObservations: Number(row.population_observations),
      capitalRelationships: Number(row.capital_relationships),
      firstPopulationYear:
        row.first_population_year == null ? null : Number(row.first_population_year),
      lastPopulationYear:
        row.last_population_year == null ? null : Number(row.last_population_year),
    };
  }
}
