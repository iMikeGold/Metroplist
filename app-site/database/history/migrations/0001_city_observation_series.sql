PRAGMA foreign_keys = ON;

CREATE TABLE history_source_releases (
  id TEXT PRIMARY KEY,
  publisher TEXT NOT NULL,
  dataset TEXT NOT NULL,
  release_name TEXT NOT NULL,
  publication_date TEXT NOT NULL,
  retrieved_at TEXT NOT NULL
);

CREATE TABLE history_source_assets (
  id TEXT PRIMARY KEY,
  source_release_id TEXT NOT NULL,
  indicator_code TEXT NOT NULL,
  source_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  FOREIGN KEY (source_release_id) REFERENCES history_source_releases(id)
);

CREATE TABLE city_observation_series (
  place_id TEXT NOT NULL,
  indicator_code TEXT NOT NULL,
  reference_year INTEGER NOT NULL,
  value_numeric REAL NOT NULL,
  evidence_status TEXT NOT NULL
    CHECK (evidence_status IN ('estimate', 'projection')),
  source_release_id TEXT NOT NULL,
  PRIMARY KEY (
    place_id,
    indicator_code,
    reference_year,
    evidence_status
  ),
  FOREIGN KEY (source_release_id) REFERENCES history_source_releases(id)
) WITHOUT ROWID;

CREATE INDEX idx_city_series_indicator_year
  ON city_observation_series(indicator_code, reference_year, place_id);

CREATE INDEX idx_city_series_year_status
  ON city_observation_series(reference_year, evidence_status, place_id);

CREATE TRIGGER city_observation_series_no_update
BEFORE UPDATE ON city_observation_series
BEGIN
  SELECT RAISE(
    ABORT,
    'city observation series is append-only; add a new source release'
  );
END;

CREATE TRIGGER city_observation_series_no_delete
BEFORE DELETE ON city_observation_series
BEGIN
  SELECT RAISE(
    ABORT,
    'city observation series is append-only; retain historical evidence'
  );
END;
