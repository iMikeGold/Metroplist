import { readFile } from "node:fs/promises";

const requiredTables = [
  "places",
  "place_names",
  "place_identifiers",
  "place_relationships",
  "geographies",
  "boundary_versions",
  "indicators",
  "units",
  "publishers",
  "datasets",
  "dataset_releases",
  "observations",
  "observation_revisions",
  "observation_lineage",
  "observation_status_history",
  "calculations",
  "calculation_inputs",
  "comparison_requests",
  "data_requests",
  "knowledge_entries",
  "knowledge_versions",
  "claims",
  "claim_evidence",
  "ingestion_runs",
  "validation_events",
  "research_sources",
  "research_source_links",
  "geographic_composites",
  "geographic_composite_members",
  "scenarios",
  "scenario_inputs",
  "scenario_relationships",
];

const migration = await readFile(
  new URL("../database/migrations/0001_initial_foundation.sql", import.meta.url),
  "utf8",
);

const missing = requiredTables.filter(
  (table) => !migration.includes(`CREATE TABLE ${table}`),
);

if (missing.length > 0) {
  console.error(`Missing foundation tables: ${missing.join(", ")}`);
  process.exit(1);
}

const appendOnly = await readFile(
  new URL(
    "../database/migrations/0002_indexes_and_append_only_guards.sql",
    import.meta.url,
  ),
  "utf8",
);

if (
  !appendOnly.includes("observations_prevent_update") ||
  !appendOnly.includes("observations_prevent_delete")
) {
  console.error("Append-only observation guards are missing.");
  process.exit(1);
}

console.log(
  `Foundation verification passed: ${requiredTables.length} required tables and append-only guards found.`,
);
