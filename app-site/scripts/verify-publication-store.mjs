import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const migration = readFileSync(
  "database/publications/migrations/0001_publication_store.sql",
  "utf8",
);
const directory = mkdtempSync(join(tmpdir(), "metroplist-publications-"));
const database = join(directory, "publications.sqlite");

function execute(sql) {
  return execFileSync("sqlite3", [database], {
    input: sql,
    encoding: "utf8",
  }).trim();
}

function expectFailure(sql, label) {
  const result = spawnSync("sqlite3", [database], {
    input: sql,
    encoding: "utf8",
  });
  if (result.status === 0) throw new Error(`${label} unexpectedly succeeded.`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  execute(migration);
  assert(
    execute("SELECT COUNT(*) FROM publication_schema_migrations;") === "1",
    "Migration record missing.",
  );
  execute(`
    PRAGMA foreign_keys=ON;
    INSERT INTO publication_snapshots (
      id, public_slug, schema_version, snapshot_type, title, summary,
      manifest_json, content_hash, canonical_url, created_at
    ) VALUES (
      'snapshot_one', '7K4M2QABCD', 1, 'comparison', 'Manchester and London',
      'A deterministic comparison.', '{"schemaVersion":1}',
      'sha256:one', 'https://app.metroplist.com/snapshot/7K4M2QABCD',
      '2026-08-01T12:00:00.000Z'
    );
    INSERT INTO publication_snapshot_references (
      id, snapshot_id, reference_type, reference_id, reference_role, ordinal
    ) VALUES
      ('ref_place', 'snapshot_one', 'place', 'place_manchester', 'subject', 0),
      ('ref_observation', 'snapshot_one', 'observation', 'obs_manchester', 'published_evidence', 1);
    INSERT INTO publication_snapshot_events (
      id, snapshot_id, event_type, related_snapshot_id, reason, created_at
    ) VALUES (
      'event_published', 'snapshot_one', 'published', NULL, NULL,
      '2026-08-01T12:00:00.000Z'
    );
    INSERT INTO publication_snapshots (
      id, public_slug, schema_version, snapshot_type, title, summary,
      manifest_json, content_hash, canonical_url, created_at
    ) VALUES (
      'snapshot_two', '9N8P7QWXYZ', 1, 'comparison', 'Corrected comparison',
      'A superseding comparison.', '{"schemaVersion":1}',
      'sha256:two', 'https://app.metroplist.com/snapshot/9N8P7QWXYZ',
      '2026-08-02T12:00:00.000Z'
    );
    INSERT INTO publication_snapshot_events (
      id, snapshot_id, event_type, related_snapshot_id, reason, created_at
    ) VALUES
      ('event_two_published', 'snapshot_two', 'published', NULL, NULL, '2026-08-02T12:00:00.000Z'),
      ('event_superseded', 'snapshot_one', 'superseded', 'snapshot_two', 'Corrected evidence frame.', '2026-08-02T12:01:00.000Z');
  `);
  assert(
    execute("SELECT COUNT(*) FROM publication_snapshot_references WHERE snapshot_id='snapshot_one';") === "2",
    "Exact Snapshot references were not preserved.",
  );
  assert(
    execute("SELECT event_type FROM publication_snapshot_events WHERE snapshot_id='snapshot_one' ORDER BY created_at DESC LIMIT 1;") === "superseded",
    "Superseding event was not preserved.",
  );
  expectFailure(
    "UPDATE publication_snapshots SET title='Changed' WHERE id='snapshot_one';",
    "Snapshot update",
  );
  expectFailure(
    "DELETE FROM publication_snapshots WHERE id='snapshot_one';",
    "Snapshot delete",
  );
  expectFailure(
    `INSERT INTO publication_snapshots (
      id, public_slug, schema_version, snapshot_type, title, summary,
      manifest_json, content_hash, canonical_url, created_at
    ) VALUES (
      'snapshot_duplicate', 'DUPLICATE1', 1, 'comparison', 'Duplicate',
      'Duplicate', '{"schemaVersion":1}', 'sha256:one',
      'https://app.metroplist.com/snapshot/DUPLICATE1',
      '2026-08-03T12:00:00.000Z'
    );`,
    "Duplicate content hash",
  );
  assert(execute("PRAGMA foreign_key_check;") === "", "Foreign-key check failed.");
  assert(
    execute("SELECT COUNT(*) FROM sqlite_master WHERE name LIKE '%_next' OR name LIKE '%staging%';") === "0",
    "Migration staging residue found.",
  );
  const before = execute(
    "SELECT (SELECT COUNT(*) FROM publication_snapshots)||':'||(SELECT COUNT(*) FROM publication_snapshot_references)||':'||(SELECT COUNT(*) FROM publication_snapshot_events);",
  );
  expectFailure(migration, "Second migration");
  const after = execute(
    "SELECT (SELECT COUNT(*) FROM publication_snapshots)||':'||(SELECT COUNT(*) FROM publication_snapshot_references)||':'||(SELECT COUNT(*) FROM publication_snapshot_events);",
  );
  assert(before === after, "Second migration attempt changed publication counts.");
  console.log(
    JSON.stringify({
      status: "passed",
      snapshots: 2,
      references: 2,
      events: 3,
      foreignKeyViolations: 0,
      immutableGuards: true,
      duplicateHashRejected: true,
      secondMigrationRejected: true,
      stagingResidue: 0,
    }),
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
