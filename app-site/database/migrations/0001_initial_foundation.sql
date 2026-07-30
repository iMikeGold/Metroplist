PRAGMA foreign_keys = ON;

CREATE TABLE units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  symbol TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE indicators (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  measurement_type TEXT NOT NULL,
  default_unit_id TEXT NOT NULL REFERENCES units(id),
  numerator_indicator_id TEXT REFERENCES indicators(id),
  denominator_indicator_id TEXT REFERENCES indicators(id),
  formula_code TEXT,
  aggregation_rule TEXT,
  comparison_rule TEXT,
  temporal_frequency TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publishers (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  jurisdiction TEXT,
  publisher_type TEXT,
  website TEXT,
  authority_grade TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE datasets (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL REFERENCES publishers(id),
  canonical_title TEXT NOT NULL,
  description TEXT,
  licence TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dataset_releases (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL REFERENCES datasets(id),
  edition TEXT,
  version TEXT,
  release_date TEXT,
  coverage_start TEXT,
  coverage_end TEXT,
  retrieved_at TEXT,
  content_hash TEXT,
  archived_object_key TEXT,
  status TEXT NOT NULL DEFAULT 'acquired',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE places (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  place_kind TEXT NOT NULL,
  country_code TEXT,
  parent_place_id TEXT REFERENCES places(id),
  status TEXT NOT NULL DEFAULT 'current',
  valid_from TEXT,
  valid_to TEXT,
  centroid_latitude REAL,
  centroid_longitude REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE place_names (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id),
  name TEXT NOT NULL,
  language_code TEXT,
  name_type TEXT NOT NULL DEFAULT 'alias',
  country_context TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  valid_from TEXT,
  valid_to TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE place_identifiers (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id),
  authority TEXT NOT NULL,
  scheme TEXT NOT NULL,
  identifier TEXT NOT NULL,
  valid_from TEXT,
  valid_to TEXT,
  source_release_id TEXT REFERENCES dataset_releases(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(authority, scheme, identifier, valid_from)
);

CREATE TABLE place_relationships (
  id TEXT PRIMARY KEY,
  subject_place_id TEXT NOT NULL REFERENCES places(id),
  relationship_type TEXT NOT NULL,
  object_place_id TEXT NOT NULL REFERENCES places(id),
  valid_from TEXT,
  valid_to TEXT,
  source_release_id TEXT REFERENCES dataset_releases(id),
  confidence TEXT NOT NULL DEFAULT 'unverified',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (subject_place_id <> object_place_id)
);

CREATE TABLE geographies (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id),
  geography_type TEXT NOT NULL,
  administrative_level TEXT,
  authority TEXT,
  official_code TEXT,
  valid_from TEXT,
  valid_to TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boundary_versions (
  id TEXT PRIMARY KEY,
  geography_id TEXT NOT NULL REFERENCES geographies(id),
  reference_date TEXT,
  reference_year INTEGER,
  source_release_id TEXT REFERENCES dataset_releases(id),
  land_area_km2 REAL,
  water_area_km2 REAL,
  total_area_km2 REAL,
  geometry_object_key TEXT,
  geometry_hash TEXT,
  simplification_level TEXT,
  licence TEXT,
  imported_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (land_area_km2 IS NULL OR land_area_km2 >= 0),
  CHECK (water_area_km2 IS NULL OR water_area_km2 >= 0),
  CHECK (total_area_km2 IS NULL OR total_area_km2 >= 0)
);

CREATE TABLE calculations (
  id TEXT PRIMARY KEY,
  calculation_type TEXT NOT NULL,
  formula_code TEXT NOT NULL,
  formula_version TEXT NOT NULL,
  output_indicator_id TEXT REFERENCES indicators(id),
  executed_at TEXT NOT NULL,
  input_manifest_json TEXT NOT NULL,
  output_value_numeric REAL,
  output_unit_id TEXT REFERENCES units(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE observations (
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
  methodology_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL)
);

CREATE TABLE observation_revisions (
  id TEXT PRIMARY KEY,
  subject_observation_id TEXT NOT NULL REFERENCES observations(id),
  related_observation_id TEXT NOT NULL REFERENCES observations(id),
  revision_type TEXT NOT NULL,
  reason TEXT,
  source_release_id TEXT REFERENCES dataset_releases(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (subject_observation_id <> related_observation_id)
);

CREATE TABLE observation_lineage (
  id TEXT PRIMARY KEY,
  output_observation_id TEXT NOT NULL REFERENCES observations(id),
  input_observation_id TEXT NOT NULL REFERENCES observations(id),
  calculation_id TEXT REFERENCES calculations(id),
  input_role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (output_observation_id <> input_observation_id)
);

CREATE TABLE observation_status_history (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL REFERENCES observations(id),
  quality_status TEXT NOT NULL,
  preferred_status TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE calculation_inputs (
  id TEXT PRIMARY KEY,
  calculation_id TEXT NOT NULL REFERENCES calculations(id),
  observation_id TEXT NOT NULL REFERENCES observations(id),
  input_role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(calculation_id, observation_id, input_role)
);

CREATE TABLE comparison_requests (
  id TEXT PRIMARY KEY,
  origin_place_id TEXT REFERENCES places(id),
  target_place_id TEXT REFERENCES places(id),
  indicator_id TEXT REFERENCES indicators(id),
  origin_geography_id TEXT REFERENCES geographies(id),
  target_geography_id TEXT REFERENCES geographies(id),
  requested_reference_period TEXT,
  comparison_mode TEXT,
  anonymous_session_id TEXT,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_requests (
  id TEXT PRIMARY KEY,
  requested_place_a_text TEXT,
  requested_place_b_text TEXT,
  resolved_place_a_id TEXT REFERENCES places(id),
  resolved_place_b_id TEXT REFERENCES places(id),
  requested_indicator_text TEXT,
  resolved_indicator_id TEXT REFERENCES indicators(id),
  status TEXT NOT NULL DEFAULT 'requested',
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  first_requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deduplication_key TEXT NOT NULL UNIQUE
);

CREATE TABLE knowledge_entries (
  id TEXT PRIMARY KEY,
  subject_place_id TEXT REFERENCES places(id),
  topic TEXT NOT NULL,
  canonical_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_versions (
  id TEXT PRIMARY KEY,
  knowledge_entry_id TEXT NOT NULL REFERENCES knowledge_entries(id),
  version_number INTEGER NOT NULL,
  summary TEXT,
  body TEXT,
  evidence_manifest_json TEXT NOT NULL DEFAULT '[]',
  editorial_status TEXT NOT NULL DEFAULT 'draft',
  fact_checked_at TEXT,
  fact_checked_by TEXT,
  valid_from TEXT,
  valid_to TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(knowledge_entry_id, version_number)
);

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  knowledge_version_id TEXT NOT NULL REFERENCES knowledge_versions(id),
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'unknown',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claim_evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(id),
  dataset_release_id TEXT REFERENCES dataset_releases(id),
  observation_id TEXT REFERENCES observations(id),
  evidence_role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (dataset_release_id IS NOT NULL OR observation_id IS NOT NULL)
);

CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  connector_code TEXT NOT NULL,
  dataset_id TEXT REFERENCES datasets(id),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  raw_object_key TEXT,
  manifest_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE validation_events (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT REFERENCES ingestion_runs(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  severity TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  message TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE research_sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  canonical_title TEXT NOT NULL,
  creator_or_publisher TEXT,
  source_url TEXT,
  published_at TEXT,
  accessed_at TEXT,
  source_status TEXT NOT NULL DEFAULT 'legacy_context_unreviewed',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE research_source_links (
  id TEXT PRIMARY KEY,
  research_source_id TEXT NOT NULL REFERENCES research_sources(id),
  linked_entity_type TEXT NOT NULL,
  linked_entity_id TEXT,
  candidate_key TEXT,
  relationship_type TEXT NOT NULL,
  context_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (linked_entity_id IS NOT NULL OR candidate_key IS NOT NULL)
);

CREATE TABLE geographic_composites (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  canonical_title TEXT NOT NULL,
  composite_type TEXT NOT NULL,
  definition TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'research_candidate',
  source_id TEXT REFERENCES research_sources(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE geographic_composite_members (
  id TEXT PRIMARY KEY,
  composite_id TEXT NOT NULL REFERENCES geographic_composites(id),
  place_id TEXT REFERENCES places(id),
  unresolved_member_label TEXT,
  member_role TEXT NOT NULL DEFAULT 'member',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (place_id IS NOT NULL OR unresolved_member_label IS NOT NULL)
);

CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  canonical_title TEXT NOT NULL,
  description TEXT NOT NULL,
  scenario_type TEXT NOT NULL,
  reference_date TEXT,
  reference_year INTEGER,
  source_id TEXT REFERENCES research_sources(id),
  status TEXT NOT NULL DEFAULT 'research_candidate',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scenario_inputs (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id),
  input_key TEXT NOT NULL,
  indicator_id TEXT REFERENCES indicators(id),
  geography_id TEXT REFERENCES geographies(id),
  composite_id TEXT REFERENCES geographic_composites(id),
  value_numeric REAL,
  value_text TEXT,
  unit_id TEXT REFERENCES units(id),
  reference_date TEXT,
  reference_year INTEGER,
  source_observation_id TEXT REFERENCES observations(id),
  provenance_status TEXT NOT NULL DEFAULT 'source_asserted_unverified',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL)
);

CREATE TABLE scenario_relationships (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id),
  density_reference_place_id TEXT REFERENCES places(id),
  density_reference_candidate_key TEXT,
  footprint_place_id TEXT REFERENCES places(id),
  footprint_composite_id TEXT REFERENCES geographic_composites(id),
  footprint_candidate_key TEXT,
  relationship_role TEXT NOT NULL,
  source_statement TEXT,
  verification_status TEXT NOT NULL DEFAULT 'required',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    density_reference_place_id IS NOT NULL OR
    density_reference_candidate_key IS NOT NULL
  ),
  CHECK (
    footprint_place_id IS NOT NULL OR
    footprint_composite_id IS NOT NULL OR
    footprint_candidate_key IS NOT NULL
  )
);
