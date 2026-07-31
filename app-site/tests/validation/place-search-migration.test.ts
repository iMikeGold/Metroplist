import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../database/migrations/0006_place_search_entries.sql", import.meta.url),
  "utf8",
);
const rebuild = readFileSync(
  new URL(
    "../../database/maintenance/rebuild_place_search_entries.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("place search projection migration", () => {
  it("indexes every supported canonical search term", () => {
    expect(migration).toContain("CREATE TABLE place_search_entries");
    expect(migration).toContain("idx_place_search_entries_value");
    expect(migration).toContain(
      "SELECT id, 'slug', slug, TRIM(slug), '', 1, 2 FROM places",
    );
    expect(migration).toContain(
      "SELECT place_id, 'official_identifier', identifier, TRIM(identifier)",
    );
    expect(migration).toContain(
      "SELECT id, 'canonical_name', canonical_name, TRIM(canonical_name), '', 1, 1",
    );
    expect(migration).toContain(
      "SELECT place_id, 'alias', name, TRIM(name), '', is_primary, 3",
    );
  });

  it("maintains the projection for future place evidence", () => {
    expect(migration).toContain("place_search_entries_after_place_insert");
    expect(migration).toContain("place_search_entries_after_identifier_insert");
    expect(migration).toContain("place_search_entries_after_name_insert");
  });

  it("provides a transactional canonical rebuild with parity assertions", () => {
    expect(rebuild).toContain("BEGIN IMMEDIATE");
    expect(rebuild).toContain("DELETE FROM place_search_entries");
    expect(rebuild).toContain("'duplicate projection identities'");
    expect(rebuild).toContain("'canonical projection parity'");
    expect(rebuild).toContain("COMMIT");
  });
});
