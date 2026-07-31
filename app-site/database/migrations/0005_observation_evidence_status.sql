PRAGMA foreign_keys = OFF;

CREATE TABLE migration_0005_observation_evidence_status_applied (
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE observation_migration_context AS
SELECT
  COUNT(*) AS observation_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'fresh_bootstrap'
    ELSE 'legacy'
  END AS migration_mode
FROM observations;

CREATE UNIQUE INDEX idx_observation_migration_context_mode
  ON observation_migration_context(migration_mode);

CREATE TABLE observations_next (
  id TEXT PRIMARY KEY,
  geography_id TEXT NOT NULL REFERENCES geographies(id),
  boundary_version_id TEXT REFERENCES boundary_versions(id),
  indicator_id TEXT NOT NULL REFERENCES indicators(id),
  unit_id TEXT NOT NULL REFERENCES units(id),
  dataset_release_id TEXT REFERENCES dataset_releases(id),
  value_numeric REAL,
  value_text TEXT,
  reference_period_start TEXT,
  reference_period_end TEXT,
  reference_year INTEGER,
  publication_date TEXT,
  ingested_at TEXT NOT NULL,
  verified_at TEXT,
  quality_status TEXT NOT NULL DEFAULT 'unverified',
  preferred_status TEXT NOT NULL DEFAULT 'candidate',
  is_estimate INTEGER NOT NULL DEFAULT 0 CHECK (is_estimate IN (0, 1)),
  evidence_status TEXT NOT NULL DEFAULT 'awaiting_review'
    CHECK (evidence_status IN (
      'reported',
      'estimate',
      'projection',
      'awaiting_review'
    )),
  methodology_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_observation_lineage_output
  ON observation_lineage(output_observation_id);

CREATE TABLE observation_derived_source_status AS
WITH RECURSIVE observation_ancestry(output_id, ancestor_id) AS (
  SELECT output_observation_id, input_observation_id
  FROM observation_lineage
  UNION ALL
  SELECT ancestry.output_id, lineage.input_observation_id
  FROM observation_ancestry ancestry
  JOIN observation_lineage lineage
    ON lineage.output_observation_id = ancestry.ancestor_id
),
leaf_sources AS (
  SELECT ancestry.output_id, input.id AS input_id,
    input.dataset_release_id
  FROM observation_ancestry ancestry
  JOIN observations input ON input.id = ancestry.ancestor_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM observation_lineage further
    WHERE further.output_observation_id = ancestry.ancestor_id
  )
)
SELECT output_id,
  CASE
    WHEN COUNT(*) = SUM(dataset_release_id = 'rel_wpp_2024')
      THEN 'estimate'
    WHEN COUNT(*) = SUM(
      dataset_release_id IS NOT NULL
      AND dataset_release_id <> 'rel_wpp_2024'
    ) THEN 'reported'
    ELSE 'awaiting_review'
  END AS evidence_status
FROM leaf_sources
GROUP BY output_id;

CREATE TABLE observation_source_status AS
SELECT observation.id AS output_id,
  CASE
    WHEN observation.dataset_release_id = 'rel_wpp_2024' THEN 'estimate'
    WHEN observation.dataset_release_id IS NOT NULL THEN 'reported'
    WHEN derived.evidence_status IS NOT NULL THEN derived.evidence_status
    ELSE 'awaiting_review'
  END AS evidence_status
FROM observations observation
LEFT JOIN observation_derived_source_status derived
  ON derived.output_id = observation.id;

DROP TABLE observation_derived_source_status;

CREATE UNIQUE INDEX idx_observation_source_status_output
  ON observation_source_status(output_id);

CREATE TABLE observation_migration_assertions (
  assertion TEXT PRIMARY KEY,
  failures INTEGER NOT NULL CHECK (failures = 0)
);

INSERT INTO observation_migration_assertions
SELECT 'classification row count',
  ABS(
    (SELECT COUNT(*) FROM observations) -
    (SELECT COUNT(*) FROM observation_source_status)
  );

INSERT INTO observation_migration_assertions
SELECT 'classification distinct observation IDs',
  ABS(
    (SELECT COUNT(*) FROM observations) -
    (SELECT COUNT(DISTINCT output_id) FROM observation_source_status)
  );

INSERT INTO observation_migration_assertions
SELECT 'unclassified observations', COUNT(*)
FROM observations observation
LEFT JOIN observation_source_status status
  ON status.output_id = observation.id
WHERE status.output_id IS NULL
   OR status.evidence_status IS NULL;

DROP TABLE observation_migration_assertions;

INSERT INTO observations_next (
  id,
  geography_id,
  boundary_version_id,
  indicator_id,
  unit_id,
  dataset_release_id,
  value_numeric,
  value_text,
  reference_period_start,
  reference_period_end,
  reference_year,
  publication_date,
  ingested_at,
  verified_at,
  quality_status,
  preferred_status,
  is_estimate,
  evidence_status,
  methodology_version,
  created_at
)
SELECT
  o.id,
  o.geography_id,
  o.boundary_version_id,
  o.indicator_id,
  o.unit_id,
  o.dataset_release_id,
  o.value_numeric,
  o.value_text,
  o.reference_period_start,
  o.reference_period_end,
  o.reference_year,
  o.publication_date,
  o.ingested_at,
  o.verified_at,
  o.quality_status,
  o.preferred_status,
  o.is_estimate,
  source_status.evidence_status,
  o.methodology_version,
  o.created_at
FROM observations o
LEFT JOIN observation_source_status source_status
  ON source_status.output_id = o.id;

DROP TABLE observation_source_status;

CREATE TABLE observation_migration_assertions (
  assertion TEXT PRIMARY KEY,
  failures INTEGER NOT NULL CHECK (failures = 0)
);

INSERT INTO observation_migration_assertions
SELECT 'observation count parity',
  ABS(
    (SELECT COUNT(*) FROM observations) -
    (SELECT COUNT(*) FROM observations_next)
  );

INSERT INTO observation_migration_assertions
SELECT 'observation ID parity',
  (SELECT COUNT(*) FROM (
    SELECT id FROM observations
    EXCEPT
    SELECT id FROM observations_next
  )) +
  (SELECT COUNT(*) FROM (
    SELECT id FROM observations_next
    EXCEPT
    SELECT id FROM observations
  ));

DROP TABLE observations;
ALTER TABLE observations_next RENAME TO observations;

CREATE INDEX idx_observations_lookup
  ON observations(geography_id, indicator_id, reference_year);
CREATE INDEX idx_observations_source_release
  ON observations(dataset_release_id);
CREATE INDEX idx_observations_indicator_year_geography
  ON observations(indicator_id, reference_year, geography_id);
CREATE INDEX idx_observations_comparison_frame
  ON observations(
    indicator_id,
    unit_id,
    reference_year DESC,
    methodology_version,
    evidence_status,
    quality_status,
    preferred_status,
    geography_id
  );

CREATE TRIGGER observations_prevent_update
BEFORE UPDATE ON observations
BEGIN
  SELECT RAISE(
    ABORT,
    'observations are append-only; add a revision or status-history record'
  );
END;

CREATE TRIGGER observations_prevent_delete
BEFORE DELETE ON observations
BEGIN
  SELECT RAISE(
    ABORT,
    'observations are append-only and cannot be deleted'
  );
END;

DROP TABLE observation_migration_assertions;

PRAGMA foreign_keys = ON;

CREATE TABLE observation_migration_assertions (
  assertion TEXT PRIMARY KEY,
  failures INTEGER NOT NULL CHECK (failures = 0)
);

INSERT INTO observation_migration_assertions
SELECT 'foreign key integrity', COUNT(*) FROM pragma_foreign_key_check;

INSERT INTO observation_migration_assertions
SELECT 'WPP evidence status',
  COUNT(*)
FROM observations
WHERE (
    dataset_release_id = 'rel_wpp_2024'
    OR id LIKE 'obs_wpp_pop_%'
  )
  AND evidence_status <> 'estimate';

INSERT INTO observation_migration_assertions
WITH expected(
  id,
  indicator_id,
  geography_id,
  reference_year,
  unit_id,
  value,
  dataset_release_id,
  preferred_status,
  evidence_status
) AS (
  VALUES
  ('obs_greenwich_household_pop_2021', 'ind_household_residents', 'geo_greenwich_ltla_2021', 2021, 'unit_people', 284650.0, 'rel_ons_ts001_2021_v3', 'preferred', 'reported'),
  ('obs_greenwich_communal_pop_2021', 'ind_communal_establishment_residents', 'geo_greenwich_ltla_2021', 2021, 'unit_people', 4418.0, 'rel_ons_ts001_2021_v3', 'preferred', 'reported'),
  ('obs_greenwich_pop_2021', 'ind_population_total', 'geo_greenwich_ltla_2021', 2021, 'unit_people', 289068.0, NULL, 'preferred', 'reported'),
  ('obs_greenwich_land_2021', 'ind_land_area_km2', 'geo_greenwich_ltla_2021', 2021, 'unit_square_kilometre', 47.3213, 'rel_ons_sam_2021_v2', 'preferred', 'reported'),
  ('obs_greenwich_density_2021', 'ind_population_density_km2', 'geo_greenwich_ltla_2021', 2021, 'unit_people_per_square_kilometre', 6108.623389467322, NULL, 'preferred', 'reported'),
  ('obs_bromley_household_pop_2021', 'ind_household_residents', 'geo_bromley_ltla_2021', 2021, 'unit_people', 328202.0, 'rel_ons_ts001_2021_v3', 'preferred', 'reported'),
  ('obs_bromley_communal_pop_2021', 'ind_communal_establishment_residents', 'geo_bromley_ltla_2021', 2021, 'unit_people', 1790.0, 'rel_ons_ts001_2021_v3', 'preferred', 'reported'),
  ('obs_bromley_pop_2021', 'ind_population_total', 'geo_bromley_ltla_2021', 2021, 'unit_people', 329992.0, NULL, 'preferred', 'reported'),
  ('obs_bromley_land_2021', 'ind_land_area_km2', 'geo_bromley_ltla_2021', 2021, 'unit_square_kilometre', 150.1562, 'rel_ons_sam_2021_v2', 'preferred', 'reported'),
  ('obs_bromley_density_2021', 'ind_population_density_km2', 'geo_bromley_ltla_2021', 2021, 'unit_people_per_square_kilometre', 2197.6581719569353, NULL, 'preferred', 'reported')
)
SELECT 'Greenwich and Bromley evidence values',
  COUNT(*)
FROM expected
LEFT JOIN observations observation ON observation.id = expected.id
WHERE (
    SELECT migration_mode
    FROM observation_migration_context
  ) = 'legacy'
  AND (
   observation.id IS NULL
   OR observation.indicator_id <> expected.indicator_id
   OR observation.geography_id <> expected.geography_id
   OR observation.reference_year <> expected.reference_year
   OR observation.unit_id <> expected.unit_id
   OR ABS(observation.value_numeric - expected.value) > 0.000000001
   OR observation.dataset_release_id IS NOT expected.dataset_release_id
   OR observation.preferred_status <> expected.preferred_status
   OR observation.evidence_status <> expected.evidence_status
  );

INSERT INTO observation_migration_assertions
WITH expected_calculations(id) AS (
  VALUES
  ('calc_greenwich_pop_total_2021'),
  ('calc_bromley_pop_total_2021'),
  ('calc_greenwich_density_2021'),
  ('calc_bromley_density_2021')
)
SELECT 'Release 0.1 calculation inputs and lineage',
  COUNT(*)
FROM expected_calculations expected
LEFT JOIN (
  SELECT calculation.id,
    COUNT(DISTINCT calculation_input.id) AS input_count,
    COUNT(DISTINCT lineage.id) AS lineage_count
  FROM calculations calculation
  LEFT JOIN calculation_inputs calculation_input
    ON calculation_input.calculation_id = calculation.id
  LEFT JOIN observation_lineage lineage
    ON lineage.calculation_id = calculation.id
  GROUP BY calculation.id
) actual ON actual.id = expected.id
WHERE (
    SELECT migration_mode
    FROM observation_migration_context
  ) = 'legacy'
  AND (
    actual.id IS NULL
    OR actual.input_count <> 2
    OR actual.lineage_count <> 2
  );

INSERT INTO observation_migration_assertions
SELECT 'no current projections', COUNT(*)
FROM observations
WHERE evidence_status = 'projection';

DROP TABLE observation_migration_assertions;
DROP TABLE observation_migration_context;
