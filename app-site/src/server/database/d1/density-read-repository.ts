import type { D1DatabaseLike } from "@/server/database/types";
import type { DensityPlaceReadModel, DensityReadRepository } from "@/server/repositories";

const DENSITY_QUERY = `
SELECT
  p.id, p.slug, p.canonical_name, p.country_code,
  g.id AS geography_id, g.geography_type, g.administrative_level, g.official_code,
  b.reference_date, d.reference_year,
  household.value_numeric AS household_population,
  communal.value_numeric AS communal_population,
  population.value_numeric AS population,
  area.value_numeric AS land_area_km2,
  d.value_numeric AS density,
  household.id AS household_observation_id,
  communal.id AS communal_observation_id,
  population.id AS population_observation_id,
  area.id AS area_observation_id,
  d.id AS density_observation_id,
  pop_calc.id AS population_calculation_id,
  density_calc.id AS density_calculation_id,
  pop_dataset.source_url AS population_source_url,
  COALESCE(pop_release.edition, '') || CASE WHEN pop_release.version IS NULL THEN '' ELSE ' v' || pop_release.version END AS population_release,
  area_dataset.source_url AS area_source_url,
  COALESCE(area_release.edition, '') || CASE WHEN area_release.version IS NULL THEN '' ELSE ' ' || area_release.version END AS area_release
FROM places p
JOIN geographies g ON g.place_id = p.id
JOIN observations d ON d.geography_id = g.id
  AND d.indicator_id = 'ind_population_density_km2'
  AND d.preferred_status = 'preferred'
  AND d.quality_status IN ('verified', 'qualified')
JOIN boundary_versions b ON b.id = d.boundary_version_id
JOIN observation_lineage density_pop_lineage ON density_pop_lineage.output_observation_id = d.id AND density_pop_lineage.input_role = 'numerator'
JOIN observations population ON population.id = density_pop_lineage.input_observation_id
JOIN calculations density_calc ON density_calc.id = density_pop_lineage.calculation_id
JOIN observation_lineage density_area_lineage ON density_area_lineage.output_observation_id = d.id AND density_area_lineage.input_role = 'denominator'
JOIN observations area ON area.id = density_area_lineage.input_observation_id
JOIN observation_lineage pop_household_lineage ON pop_household_lineage.output_observation_id = population.id AND pop_household_lineage.input_role = 'household_residents'
JOIN observations household ON household.id = pop_household_lineage.input_observation_id
JOIN calculations pop_calc ON pop_calc.id = pop_household_lineage.calculation_id
JOIN observation_lineage pop_communal_lineage ON pop_communal_lineage.output_observation_id = population.id AND pop_communal_lineage.input_role = 'communal_establishment_residents'
JOIN observations communal ON communal.id = pop_communal_lineage.input_observation_id
JOIN dataset_releases pop_release ON pop_release.id = household.dataset_release_id
JOIN datasets pop_dataset ON pop_dataset.id = pop_release.dataset_id
JOIN dataset_releases area_release ON area_release.id = area.dataset_release_id
JOIN datasets area_dataset ON area_dataset.id = area_release.dataset_id
WHERE p.slug = ? AND (? IS NULL OR d.reference_year = ?)
ORDER BY d.reference_year DESC, d.verified_at DESC
LIMIT 1`;

function requiredNumber(value: unknown, field: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid density read-model field: ${field}`);
  return number;
}

function map(row: Record<string, unknown>): DensityPlaceReadModel {
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.canonical_name),
    officialCode: String(row.official_code), geographyId: String(row.geography_id),
    geographyType: String(row.geography_type), administrativeLevel: row.administrative_level as string | null,
    country: row.country_code === "GB-ENG" ? "England" : String(row.country_code), region: "Greater London",
    referenceYear: requiredNumber(row.reference_year, "reference_year"),
    boundaryVersion: `Census 2021 statistical geography (${String(row.reference_date)})`,
    householdPopulation: requiredNumber(row.household_population, "household_population"),
    communalPopulation: requiredNumber(row.communal_population, "communal_population"),
    population: requiredNumber(row.population, "population"), landAreaKm2: requiredNumber(row.land_area_km2, "land_area_km2"),
    density: requiredNumber(row.density, "density"), householdObservationId: String(row.household_observation_id),
    communalObservationId: String(row.communal_observation_id), populationObservationId: String(row.population_observation_id),
    areaObservationId: String(row.area_observation_id), densityObservationId: String(row.density_observation_id),
    populationCalculationId: String(row.population_calculation_id), densityCalculationId: String(row.density_calculation_id),
    populationSourceUrl: String(row.population_source_url), populationRelease: String(row.population_release),
    areaSourceUrl: String(row.area_source_url), areaRelease: String(row.area_release),
  };
}

export class D1DensityReadRepository implements DensityReadRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async findDensityBySlug(slug: string, referenceYear?: number) {
    const year = referenceYear ?? null;
    const row = await this.db.prepare(DENSITY_QUERY).bind(slug, year, year).first<Record<string, unknown>>();
    return row ? map(row) : null;
  }
}
