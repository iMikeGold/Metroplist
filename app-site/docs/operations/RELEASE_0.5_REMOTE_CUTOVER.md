# Release 0.5 Remote Cutover

Status: locally proven, remote execution not authorised.

This runbook is the proposed blue-green import and application cutover for
Release 0.5. Running any remote command below requires separate authorisation.
The existing databases remain rollback points:

- `metroplist-data` (`32483de6-fc5b-4d94-9ca1-d3bd73a796d1`)
- `metroplist-data-v2` (`443d7d74-a820-4f5d-a4f4-493bb88b5cfa`)

Do not mutate or delete either database during this cutover.

## Physical layout

Release 0.5 uses three D1 databases behind the repository boundary:

| Database | Future binding | Contents | Measured SQLite size |
| --- | --- | --- | ---: |
| `metroplist-data-v3` | `DB` | Places, search, relationships, provenance, latest city records, country history, UK evidence and comparisons | 195,194,880 bytes |
| `metroplist-city-history-estimates` | `CITY_HISTORY_ESTIMATES` | WUP city estimate series, 1975-2025 | 327,761,920 bytes |
| `metroplist-city-history-projections` | `CITY_HISTORY_PROJECTIONS` | WUP city projection series, 2026-2050 | 261,722,112 bytes |

Each measured database remains below 500 MB. Dense histories are not copied
into the fast record database. The application must treat all three physical
stores as one Metroplist service.

## Local readiness gate

The following prerequisites were proven locally on 31 July 2026:

1. The final raw-source hashes match the release manifests.
2. The main generated imports match their release manifest hashes.
3. `database/history/migrations/0001_city_observation_series.sql` creates
   the lean schema, indexes, provenance tables and append-only guards.
4. Two separate generated imports are reproducible:
   - `database/generated/0006_wup_city_estimates.sql`
   - `database/generated/0006_wup_city_projections.sql`
5. Both imports target `city_observation_series`, never `observations`.
6. The maximum statements are 24,101 and 21,880 bytes respectively, below
   D1's 100,000-byte statement limit.
7. Generated imports contain no explicit `BEGIN`, `COMMIT` or `ROLLBACK`.
8. Fresh local imports and second imports reproduce the measured row counts.
9. Semantic duplicate groups and foreign-key violations are zero.
10. Both append-only update/delete guards reject mutations.
11. Each database contains one source release and four hashed source assets.
12. No staging tables remain after import.

Generated artifacts:

```text
Estimate import
  rows                 1,758,844
  bytes                162,093,848
  SHA-256              e8c737ac99bc769332a395c883b088e1e957dc6b148610d3287a0392879dd3ad

Projection import
  rows                 1,360,028
  bytes                128,110,399
  SHA-256              4af90b409cb275264a7098a19cf8d78ec7acf5b9992c7ee6101febd0b60c26bf
```

Remote creation remains blocked only by explicit authorisation and the final
pre-remote review. Runtime history-binding reads may be introduced before the
application cutover; the physical databases do not require cross-database SQL
joins.

## Stage 1: Rebuild and verify local artifacts

Run from `app-site/`:

```bash
python3 scripts/ingest/acquire-world-data.py
python3 scripts/ingest/acquire-uk-places.py
python3 scripts/ingest/acquire-release-05.py \
  --measure-sqlite-dir data/staging/release-05-sizing
python3 scripts/ingest/acquire-uk-evidence.py
```

Required main graph:

```text
places                         32,943
geographies                    32,839
observations                  149,506
  estimate                    113,319
  reported                     36,187
  projection                        0
calculations                   37,793
calculation_inputs             58,048
observation_lineage            58,048
place_search_entries          132,346
dataset_releases                    9
place_relationships            25,161
foreign-key violations              0
```

Required history graphs:

```text
estimate rows               1,758,844
estimate years              1975-2025
estimate evidence status    estimate

projection rows             1,360,028
projection years            2026-2050
projection evidence status  projection
```

Reapply every import locally. All counts and source hashes must remain
unchanged, and all semantic duplicate checks must return zero.

The verified indexed database sizes are:

```text
metroplist-city-history-estimates.sqlite    327,761,920 bytes
metroplist-city-history-projections.sqlite  261,722,112 bytes
```

## Stage 2: Record a rollback snapshot

This stage is read-only:

```bash
npx wrangler d1 info metroplist-data-v2
npx wrangler d1 time-travel info metroplist-data-v2
npx wrangler d1 migrations list metroplist-data-v2 --remote
npx wrangler d1 execute metroplist-data-v2 --remote --command="
SELECT COUNT(*) AS places FROM places;
SELECT COUNT(*) AS observations FROM observations;
SELECT COUNT(*) AS data_requests FROM data_requests;
PRAGMA foreign_key_check;
"
```

Record the database UUID, size, migration list, counts and current Time Travel
bookmark in the release log. If `data_requests` is no longer empty, export it
before proceeding and prepare a reviewed, idempotent copy import.

## Stage 3: Create blue-green databases

Run only after explicit authorisation:

```bash
npx wrangler d1 create metroplist-data-v3 --location=weur
npx wrangler d1 create metroplist-city-history-estimates --location=weur
npx wrangler d1 create metroplist-city-history-projections --location=weur
```

Copy the three returned UUIDs into the release log. Do not change
`wrangler.jsonc` yet.

## Stage 4: Build the fast database

Use the immutable database name rather than the current `DB` binding:

```bash
npx wrangler d1 migrations apply metroplist-data-v3 --remote

npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/seeds/0001_reference_data.sql
npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/seeds/0002_greenwich_bromley_density_2021.sql
npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/seeds/0003_map_manifest.sql

npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/generated/0003_world_registry.sql
npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/generated/0004_uk_places.sql
npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/generated/0005_release_05_main.sql
npx wrangler d1 execute metroplist-data-v3 --remote \
  --file=database/generated/0007_uk_population_evidence.sql
```

Execute commands serially. Stop at the first non-zero result. A partially
populated blue-green database is never bound to the Worker.

If the account is subject to the Free-plan daily write allowance, pause between
files as required. Do not reduce coverage or bypass validation to accelerate
the import.

## Stage 5: Build the history databases

Apply the dedicated lean schema, then its matching partition only:

```bash
npx wrangler d1 execute metroplist-city-history-estimates --remote \
  --file=database/history/migrations/0001_city_observation_series.sql
npx wrangler d1 execute metroplist-city-history-estimates --remote \
  --file=database/generated/0006_wup_city_estimates.sql

npx wrangler d1 execute metroplist-city-history-projections --remote \
  --file=database/history/migrations/0001_city_observation_series.sql
npx wrangler d1 execute metroplist-city-history-projections --remote \
  --file=database/generated/0006_wup_city_projections.sql
```

Never apply the full foundation migrations to a history database. Never apply a
history import to the main `observations` table.

## Stage 6: Verify all three databases

Fast database:

```bash
npx wrangler d1 execute metroplist-data-v3 --remote --command="
SELECT COUNT(*) AS places FROM places;
SELECT COUNT(*) AS geographies FROM geographies;
SELECT COUNT(*) AS observations FROM observations;
SELECT evidence_status, COUNT(*) AS observations
FROM observations GROUP BY evidence_status ORDER BY evidence_status;
SELECT COUNT(*) AS calculations FROM calculations;
SELECT COUNT(*) AS calculation_inputs FROM calculation_inputs;
SELECT COUNT(*) AS lineage FROM observation_lineage;
SELECT COUNT(*) AS search_entries FROM place_search_entries;
SELECT COUNT(*) AS releases FROM dataset_releases;
SELECT COUNT(*) AS relationships FROM place_relationships;
PRAGMA foreign_key_check;
"
```

History estimates:

```bash
npx wrangler d1 execute metroplist-city-history-estimates --remote --command="
SELECT COUNT(*) AS rows,
       MIN(reference_year) AS first_year,
       MAX(reference_year) AS last_year,
       COUNT(DISTINCT place_id) AS places
FROM city_observation_series;
SELECT evidence_status, COUNT(*) AS rows
FROM city_observation_series GROUP BY evidence_status;
"
```

History projections:

```bash
npx wrangler d1 execute metroplist-city-history-projections --remote --command="
SELECT COUNT(*) AS rows,
       MIN(reference_year) AS first_year,
       MAX(reference_year) AS last_year,
       COUNT(DISTINCT place_id) AS places
FROM city_observation_series;
SELECT evidence_status, COUNT(*) AS rows
FROM city_observation_series GROUP BY evidence_status;
"
```

Also verify:

- all ten Release 0.1 observation IDs and values;
- all four Release 0.1 calculations;
- eight Release 0.1 calculation inputs and lineage links;
- zero semantic duplicates;
- Kosovo and Taiwan remain WPP-scoped identities;
- WPP `LocID` is never treated as M49;
- all required search examples return deterministic candidates;
- `data_requests` copied from v2 exactly when applicable;
- `wrangler d1 info` reports each database below its storage ceiling.

Repeat the four main imports and both history imports. Counts and hashes must
remain unchanged.

## Stage 7: Prepare the binding diff

Only after all remote verification passes, replace the local D1 configuration
with the three verified UUIDs:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "metroplist-data-v3",
    "database_id": "<V3_UUID>",
    "migrations_dir": "database/migrations"
  },
  {
    "binding": "CITY_HISTORY_ESTIMATES",
    "database_name": "metroplist-city-history-estimates",
    "database_id": "<ESTIMATES_UUID>"
  },
  {
    "binding": "CITY_HISTORY_PROJECTIONS",
    "database_name": "metroplist-city-history-projections",
    "database_id": "<PROJECTIONS_UUID>"
  }
]
```

Then run:

```bash
npm run cf-typegen
npm run lint
npm run typecheck
npm run test
npm run foundation:verify
npm run build
npm run build:cloudflare
npm audit --omit=dev
```

Review the exact binding diff and generated types before any commit.

## Stage 8: Commit, push and deploy

This stage requires separate explicit authorisation.

After commit and push, deploy the saved exact tree:

```bash
npm run deploy:cloudflare
```

Smoke-test:

```text
/api/health
/api/coverage
/api/places?q=london
/api/places?q=E09000011
/api/places?q=tokyo
/map
/compare
/place/<verified-country-slug>
/place/<verified-city-slug>
```

Confirm D1-backed search, place records, comparison selection, timeline reads,
map movement and location-hint fallback independently.

## Rollback

Before deployment, rollback means making no binding change.

After deployment, restore the previous `wrangler.jsonc` `DB` binding to
`metroplist-data-v2`, remove the two history bindings from the application
configuration, rebuild and redeploy the last known-good application commit.
Do not delete v3 while investigating. The original `metroplist-data` and v2
databases remain untouched.
