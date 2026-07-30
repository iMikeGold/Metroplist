# Database schema

The SQL migrations are the executable schema source of truth.

The logical model is intentionally portable beyond D1:

- immutable Metroplist identifiers;
- append-only observations and dataset releases;
- explicit time, boundary and source dimensions;
- revisions and lineage rather than destructive replacement;
- service and repository boundaries between storage and presentation.

Do not manually edit a production database to introduce schema changes. Add a numbered migration.
