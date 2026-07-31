BEGIN IMMEDIATE;

DELETE FROM place_search_entries;

INSERT OR IGNORE INTO place_search_entries (
  place_id, entry_type, display_value, normalized_value, authority,
  is_primary, ranking_weight
)
SELECT id, 'slug', slug, TRIM(slug), '', 1, 2 FROM places
UNION ALL
SELECT place_id, 'official_identifier', identifier, TRIM(identifier),
  authority, 1, 0 FROM place_identifiers
UNION ALL
SELECT id, 'canonical_name', canonical_name, TRIM(canonical_name), '', 1, 1
  FROM places
UNION ALL
SELECT place_id, 'alias', name, TRIM(name), '', is_primary, 3
  FROM place_names;

CREATE TABLE place_search_rebuild_assertions (
  assertion TEXT PRIMARY KEY,
  failures INTEGER NOT NULL CHECK (failures = 0)
);

INSERT INTO place_search_rebuild_assertions
SELECT 'duplicate projection identities',
  COUNT(*)
FROM (
  SELECT place_id, entry_type, normalized_value, authority
  FROM place_search_entries
  GROUP BY place_id, entry_type, normalized_value, authority
  HAVING COUNT(*) > 1
);

INSERT INTO place_search_rebuild_assertions
WITH canonical_entries(place_id, entry_type, normalized_value, authority) AS (
  SELECT id, 'slug', TRIM(slug), '' FROM places
  UNION
  SELECT place_id, 'official_identifier', TRIM(identifier), authority
    FROM place_identifiers
  UNION
  SELECT id, 'canonical_name', TRIM(canonical_name), '' FROM places
  UNION
  SELECT place_id, 'alias', TRIM(name), '' FROM place_names
)
SELECT 'canonical projection parity',
  ABS(
    (SELECT COUNT(*) FROM canonical_entries) -
    (SELECT COUNT(*) FROM place_search_entries)
  );

DROP TABLE place_search_rebuild_assertions;

COMMIT;
