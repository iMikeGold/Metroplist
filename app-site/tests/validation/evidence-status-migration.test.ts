import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../database/migrations/0005_observation_evidence_status.sql", import.meta.url),
  "utf8",
);

describe("observation evidence-status migration", () => {
  it("copies observations into an explicit-status table and restores both guards", () => {
    expect(migration).toContain("CREATE TABLE observations_next");
    expect(migration).toContain(
      "migration_0005_observation_evidence_status_applied",
    );
    expect(migration).toContain("'reported'");
    expect(migration).toContain("'estimate'");
    expect(migration).toContain("'projection'");
    expect(migration).toContain("'awaiting_review'");
    expect(migration).toContain("CREATE TRIGGER observations_prevent_update");
    expect(migration).toContain("CREATE TRIGGER observations_prevent_delete");
  });

  it("classifies WPP source and derived observations from release lineage", () => {
    expect(migration).toContain("dataset_release_id = 'rel_wpp_2024'");
    expect(migration).toContain("observation_lineage");
    expect(migration).not.toContain("methodology_version LIKE");
  });

  it("asserts identity, foreign keys, and accepted evidence classifications", () => {
    expect(migration).toContain("'observation count parity'");
    expect(migration).toContain("'observation ID parity'");
    expect(migration).toContain("'classification distinct observation IDs'");
    expect(migration).toContain("'unclassified observations'");
    expect(migration).toContain("pragma_foreign_key_check");
    expect(migration).toContain("'Greenwich and Bromley evidence values'");
  });
});
