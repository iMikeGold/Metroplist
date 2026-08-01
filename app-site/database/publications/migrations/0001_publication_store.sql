PRAGMA foreign_keys = ON;

CREATE TABLE publication_schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publication_snapshots (
  id TEXT PRIMARY KEY,
  public_slug TEXT NOT NULL UNIQUE,
  schema_version INTEGER NOT NULL,
  snapshot_type TEXT NOT NULL CHECK (
    snapshot_type IN (
      'place_profile', 'comparison', 'ranking', 'trend',
      'map_extract', 'collection', 'indicator_profile'
    )
  ),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  manifest_json TEXT NOT NULL CHECK (json_valid(manifest_json)),
  content_hash TEXT NOT NULL UNIQUE,
  canonical_url TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'published'
    CHECK (publication_status = 'published')
);

CREATE TABLE publication_snapshot_references (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES publication_snapshots(id),
  reference_type TEXT NOT NULL CHECK (
    reference_type IN (
      'place', 'observation', 'calculation', 'indicator', 'source_release'
    )
  ),
  reference_id TEXT NOT NULL,
  reference_role TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  UNIQUE(snapshot_id, reference_type, reference_id, reference_role)
);

CREATE TABLE publication_snapshot_events (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES publication_snapshots(id),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('published', 'withdrawn', 'superseded')
  ),
  related_snapshot_id TEXT REFERENCES publication_snapshots(id),
  reason TEXT,
  created_at TEXT NOT NULL,
  CHECK (
    (event_type = 'superseded' AND related_snapshot_id IS NOT NULL)
    OR (event_type <> 'superseded' AND related_snapshot_id IS NULL)
  )
);

CREATE INDEX idx_publication_snapshots_slug
  ON publication_snapshots(public_slug);
CREATE INDEX idx_publication_snapshots_hash
  ON publication_snapshots(content_hash);
CREATE INDEX idx_publication_references_lookup
  ON publication_snapshot_references(reference_type, reference_id, snapshot_id);
CREATE INDEX idx_publication_events_snapshot
  ON publication_snapshot_events(snapshot_id, created_at DESC, id DESC);

CREATE TRIGGER publication_snapshots_no_update
BEFORE UPDATE ON publication_snapshots
BEGIN
  SELECT RAISE(ABORT, 'published snapshots are immutable');
END;

CREATE TRIGGER publication_snapshots_no_delete
BEFORE DELETE ON publication_snapshots
BEGIN
  SELECT RAISE(ABORT, 'published snapshots are append-only');
END;

CREATE TRIGGER publication_references_no_update
BEFORE UPDATE ON publication_snapshot_references
BEGIN
  SELECT RAISE(ABORT, 'snapshot references are immutable');
END;

CREATE TRIGGER publication_references_no_delete
BEFORE DELETE ON publication_snapshot_references
BEGIN
  SELECT RAISE(ABORT, 'snapshot references are append-only');
END;

CREATE TRIGGER publication_events_no_update
BEFORE UPDATE ON publication_snapshot_events
BEGIN
  SELECT RAISE(ABORT, 'snapshot events are immutable');
END;

CREATE TRIGGER publication_events_no_delete
BEFORE DELETE ON publication_snapshot_events
BEGIN
  SELECT RAISE(ABORT, 'snapshot events are append-only');
END;

INSERT INTO publication_schema_migrations (version, name)
VALUES (1, '0001_publication_store.sql');
