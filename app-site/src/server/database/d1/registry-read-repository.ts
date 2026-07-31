import type { D1DatabaseLike } from "@/server/database/types";
import type {
  CoverageSummary,
  PlaceDetail,
  PlaceIndicatorEvidence,
  PlaceIndicatorSummary,
  PlaceSearchQuery,
  PlaceSearchResult,
  RegistryReadRepository,
} from "@/server/repositories";

type Row = Record<string, unknown>;

function splitList(value: unknown): string[] {
  return value ? String(value).split("\u001f").filter(Boolean) : [];
}

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function mapSearchResult(row: Row): PlaceSearchResult {
  const matchedBy =
    row.matched_entry_type === "official_identifier"
      ? "identifier"
      : (String(row.matched_entry_type) as PlaceSearchResult["matchedBy"]);
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
    matchedBy,
    matchedValue: String(row.matched_display_value ?? row.canonical_name),
    matchClass: row.match_class === "prefix" ? "prefix" : "exact",
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
      WITH matched_entries AS (
        SELECT entry.place_id, entry.entry_type, entry.display_value,
          entry.is_primary, entry.ranking_weight,
          CASE
            WHEN entry.normalized_value = ? COLLATE NOCASE
              THEN 'exact'
            ELSE 'prefix'
          END AS match_class,
          CASE
            WHEN entry.normalized_value = ? COLLATE NOCASE
              THEN entry.ranking_weight
            ELSE entry.ranking_weight + 10
          END AS match_rank,
          ROW_NUMBER() OVER (
            PARTITION BY entry.place_id
            ORDER BY
              CASE
                WHEN entry.normalized_value = ? COLLATE NOCASE
                  THEN entry.ranking_weight
                ELSE entry.ranking_weight + 10
              END,
              entry.is_primary DESC,
              LENGTH(entry.display_value),
              entry.entry_type,
              entry.display_value COLLATE NOCASE
          ) AS entry_rank
        FROM place_search_entries entry
        WHERE entry.normalized_value >= ? COLLATE NOCASE
          AND entry.normalized_value < ? COLLATE NOCASE
          AND (
            entry.entry_type <> 'official_identifier'
            OR entry.normalized_value = ? COLLATE NOCASE
          )
      ),
      ranked_candidates AS (
        SELECT hit.place_id, hit.entry_type AS matched_entry_type,
          hit.display_value AS matched_display_value, hit.match_class,
          hit.is_primary, hit.ranking_weight, hit.match_rank,
          COUNT(*) OVER () AS name_match_count
        FROM matched_entries hit
        JOIN places candidate ON candidate.id = hit.place_id
        WHERE hit.entry_rank = 1
          AND (? IS NULL OR candidate.country_code = ?)
          AND (? IS NULL OR EXISTS (
            SELECT 1 FROM geographies candidate_geography
            WHERE candidate_geography.place_id = candidate.id
              AND candidate_geography.geography_type = ?
          ))
        ORDER BY hit.match_rank, hit.is_primary DESC,
          LENGTH(hit.display_value), candidate.canonical_name COLLATE NOCASE,
          candidate.place_kind, candidate.id
        LIMIT ?
      )
      SELECT p.*, parent.canonical_name AS parent_name,
        candidate.matched_entry_type, candidate.matched_display_value,
        candidate.match_class, candidate.ranking_weight, candidate.match_rank,
        candidate.name_match_count,
        (SELECT GROUP_CONCAT(geography_type, char(31))
          FROM (SELECT DISTINCT geography_type
            FROM geographies WHERE place_id = p.id)) AS geography_types
      FROM ranked_candidates candidate
      JOIN places p ON p.id = candidate.place_id
      LEFT JOIN places parent ON parent.id = p.parent_place_id
      ORDER BY candidate.match_rank, candidate.is_primary DESC,
        LENGTH(candidate.matched_display_value),
        p.canonical_name COLLATE NOCASE, p.place_kind, p.id`;
    const normalizedQuery = normalizeSearchValue(query);
    const prefixUpperBound = `${normalizedQuery}\uffff`;
    const result = await this.db
      .prepare(sql)
      .bind(
        normalizedQuery,
        normalizedQuery,
        normalizedQuery,
        normalizedQuery,
        prefixUpperBound,
        normalizedQuery,
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
          'slug' AS matched_entry_type, p.slug AS matched_display_value,
          'exact' AS match_class, 1 AS name_match_count,
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
          MAX(CASE WHEN po.latest_rank = 1 THEN po.is_estimate END) AS is_estimate,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.methodology_version END) AS methodology_version,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.quality_status END) AS quality_status,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.preferred_status END) AS preferred_status,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.evidence_status END) AS evidence_status,
          MAX(CASE WHEN po.latest_rank = 1 THEN po.dataset_release_id END) AS dataset_release_id
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
      methodologyVersion:
        row.methodology_version == null ? null : String(row.methodology_version),
      qualityStatus: String(row.quality_status),
      preferredStatus: String(row.preferred_status),
      observationStatus: String(row.evidence_status) as
        | "reported"
        | "estimate"
        | "projection"
        | "awaiting_review",
      sourceReleaseId:
        row.dataset_release_id == null ? null : String(row.dataset_release_id),
    }));
  }

  async listPlaceIndicatorEvidence(placeId: string): Promise<PlaceIndicatorEvidence[]> {
    const result = await this.db
      .prepare(`
        SELECT o.id AS observation_id, i.code AS indicator_code,
          i.canonical_name AS indicator_name, u.symbol,
          o.value_numeric, o.reference_year, o.reference_period_start,
          o.reference_period_end, o.methodology_version, o.quality_status,
          o.preferred_status, o.is_estimate, o.evidence_status, o.dataset_release_id,
          g.id AS geography_id, g.geography_type
        FROM observations o
        JOIN geographies g ON g.id = o.geography_id
        JOIN indicators i ON i.id = o.indicator_id
        JOIN units u ON u.id = o.unit_id
        WHERE g.place_id = ?
          AND o.preferred_status = 'preferred'
          AND o.quality_status IN ('verified', 'qualified')
        ORDER BY i.code, o.reference_year DESC, o.verified_at DESC, o.id`)
      .bind(placeId)
      .all<Row>();
    return (result.results ?? []).map((row) => ({
      observationId: String(row.observation_id),
      indicatorCode: String(row.indicator_code),
      indicatorName: String(row.indicator_name),
      unit: String(row.symbol),
      value: row.value_numeric == null ? null : Number(row.value_numeric),
      referenceYear: row.reference_year == null ? null : Number(row.reference_year),
      referencePeriodStart:
        row.reference_period_start == null ? null : String(row.reference_period_start),
      referencePeriodEnd:
        row.reference_period_end == null ? null : String(row.reference_period_end),
      methodologyVersion:
        row.methodology_version == null ? null : String(row.methodology_version),
      qualityStatus: String(row.quality_status),
      preferredStatus: String(row.preferred_status),
      estimate: Number(row.is_estimate) === 1,
      observationStatus: String(row.evidence_status) as
        | "reported"
        | "estimate"
        | "projection"
        | "awaiting_review",
      sourceReleaseId:
        row.dataset_release_id == null ? null : String(row.dataset_release_id),
      geographyId: String(row.geography_id),
      geographyType: String(row.geography_type),
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
