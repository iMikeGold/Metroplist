import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../database/history/migrations/0001_city_observation_series.sql",
    import.meta.url,
  ),
  "utf8",
);
const generator = readFileSync(
  new URL("../../scripts/ingest/acquire-release-05.py", import.meta.url),
  "utf8",
);

describe("city history storage contract", () => {
  it("creates an indexed append-only lean series table", () => {
    expect(migration).toContain("CREATE TABLE city_observation_series");
    expect(migration).toContain("WITHOUT ROWID");
    expect(migration).toContain("idx_city_series_indicator_year");
    expect(migration).toContain("idx_city_series_year_status");
    expect(migration).toContain("city_observation_series_no_update");
    expect(migration).toContain("city_observation_series_no_delete");
  });

  it("generates separate bounded estimate and projection imports", () => {
    expect(generator).toContain("0006_wup_city_estimates.sql");
    expect(generator).toContain("0006_wup_city_projections.sql");
    expect(generator).toContain("INSERT OR IGNORE INTO city_observation_series");
    expect(generator).toContain("if encoded_bytes >= 100_000");
    expect(generator).not.toContain("def generate_series(");
  });
});
