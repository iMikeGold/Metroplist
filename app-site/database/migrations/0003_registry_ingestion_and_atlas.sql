CREATE TABLE source_assets (
  id TEXT PRIMARY KEY,
  dataset_release_id TEXT NOT NULL REFERENCES dataset_releases(id),
  source_url TEXT NOT NULL,
  media_type TEXT,
  byte_size INTEGER,
  content_hash TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  archive_status TEXT NOT NULL DEFAULT 'external_source',
  archived_object_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dataset_release_id, content_hash)
);

CREATE TABLE place_classifications (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id),
  classification_scheme TEXT NOT NULL,
  classification_code TEXT NOT NULL,
  classification_status TEXT NOT NULL,
  source_release_id TEXT REFERENCES dataset_releases(id),
  valid_from TEXT,
  valid_to TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(place_id, classification_scheme, classification_code, valid_from)
);

CREATE TABLE ingestion_staging_rows (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL REFERENCES ingestion_runs(id),
  source_row_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'staged',
  canonical_entity_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ingestion_run_id, source_row_key)
);

CREATE TABLE data_request_status_history (
  id TEXT PRIMARY KEY,
  data_request_id TEXT NOT NULL REFERENCES data_requests(id),
  status TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  reason TEXT,
  ingestion_run_id TEXT REFERENCES ingestion_runs(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boundary_geometry_assets (
  id TEXT PRIMARY KEY,
  boundary_version_id TEXT NOT NULL REFERENCES boundary_versions(id),
  source_asset_id TEXT REFERENCES source_assets(id),
  format TEXT NOT NULL,
  object_key TEXT,
  content_hash TEXT,
  licence TEXT,
  display_only INTEGER NOT NULL DEFAULT 0 CHECK (display_only IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE map_layer_manifests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  canonical_title TEXT NOT NULL,
  indicator_id TEXT REFERENCES indicators(id),
  geography_type TEXT,
  boundary_source_disclosure TEXT NOT NULL,
  configuration_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_source_assets_release ON source_assets(dataset_release_id);
CREATE INDEX idx_place_classifications_lookup ON place_classifications(classification_scheme, classification_code, classification_status);
CREATE INDEX idx_place_classifications_place ON place_classifications(place_id);
CREATE INDEX idx_staging_run_status ON ingestion_staging_rows(ingestion_run_id, validation_status);
CREATE INDEX idx_data_request_history ON data_request_status_history(data_request_id, effective_at DESC);
CREATE INDEX idx_boundary_geometry_boundary ON boundary_geometry_assets(boundary_version_id);
