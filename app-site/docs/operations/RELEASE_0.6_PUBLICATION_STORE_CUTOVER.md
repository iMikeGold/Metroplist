# Release 0.6 publication-store cutover

This runbook is preparation only. Do not execute it until the local Release 0.6
checkpoint is reviewed and remote creation is separately authorised.

## Boundary

The publication store is separate from all evidence databases:

```text
metroplist-data-v3
metroplist-city-history-estimates
metroplist-city-history-projections
metroplist-data-v2
metroplist-data
```

None of those databases is migrated or rewritten by this cutover.

Proposed database:

```text
name: metroplist-publications
location: WEUR
binding: PUBLICATIONS_DB
```

## Preflight

From the exact reviewed release commit:

```bash
git status --short
git rev-parse HEAD
cd app-site
npm run publications:verify
```

The working tree must be clean and the disposable SQLite proof must pass.

## Create

After explicit authorisation:

```bash
npx wrangler d1 create metroplist-publications --location=weur
```

Record the returned UUID. Do not edit `wrangler.jsonc` yet.

Create a temporary Wrangler configuration that binds only the new UUID as
`PUBLICATIONS_DB`, then apply:

```bash
npx wrangler d1 execute metroplist-publications --remote \
  --file=database/publications/migrations/0001_publication_store.sql
```

Do not apply the evidence migrations to this database.

## Verify empty store

```sql
SELECT version, name FROM publication_schema_migrations ORDER BY version;
SELECT name, type
FROM sqlite_master
WHERE name LIKE 'publication_%'
ORDER BY type, name;
PRAGMA foreign_key_check;
```

Expected:

```text
migration versions: 1
snapshots: 0
references: 0
events: 0
foreign-key violations: 0
```

Verify the three append-only trigger pairs and all four indexes. A deliberate
second migration attempt must fail before modifying any rows.

## Bind and release

Only after the remote empty-store verification passes:

1. Add `PUBLICATIONS_DB` to `wrangler.jsonc` with the verified UUID.
2. Run `npm run cf-typegen`.
3. Run the complete Release 0.6 gate once.
4. Review the exact binding diff.
5. Commit and push only after approval.
6. Deploy the exact reviewed commit from supported macOS or Linux.

## Live acceptance

Create one place-profile Snapshot and one comparison Snapshot. Verify:

- opaque public slugs;
- exact observation and place references;
- content-hash deduplication;
- refresh persistence;
- CSV and JSON downloads;
- all four image variants;
- native-share capability detection and fallbacks;
- embed rendering and dedicated frame policy;
- report-data-issue context;
- zero writes to evidence databases.

## Rollback

Remove the `PUBLICATIONS_DB` binding and redeploy the last known-good Worker.
Do not delete the publication database during investigation. Snapshot creation
will return a controlled unavailable response while the binding is absent.
