CREATE TABLE place_search_entries (
  place_id TEXT NOT NULL REFERENCES places(id),
  entry_type TEXT NOT NULL
    CHECK (entry_type IN (
      'canonical_name',
      'alias',
      'slug',
      'official_identifier'
    )),
  display_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL COLLATE NOCASE,
  authority TEXT NOT NULL DEFAULT '',
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  ranking_weight INTEGER NOT NULL CHECK (ranking_weight BETWEEN 0 AND 3),
  PRIMARY KEY (place_id, entry_type, normalized_value, authority)
);

CREATE INDEX idx_place_search_entries_value
  ON place_search_entries(
    normalized_value COLLATE NOCASE,
    ranking_weight,
    place_id
  );

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

CREATE TRIGGER place_search_entries_after_place_insert
AFTER INSERT ON places
BEGIN
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (NEW.id, 'slug', NEW.slug, TRIM(NEW.slug), '', 1, 2);
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (
    NEW.id, 'canonical_name', NEW.canonical_name, TRIM(NEW.canonical_name),
    '', 1, 1
  );
END;

CREATE TRIGGER place_search_entries_after_place_update
AFTER UPDATE OF slug, canonical_name ON places
BEGIN
  DELETE FROM place_search_entries
  WHERE place_id = OLD.id
    AND entry_type IN ('slug', 'canonical_name');
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (NEW.id, 'slug', NEW.slug, TRIM(NEW.slug), '', 1, 2);
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (
    NEW.id, 'canonical_name', NEW.canonical_name, TRIM(NEW.canonical_name),
    '', 1, 1
  );
END;

CREATE TRIGGER place_search_entries_after_place_delete
AFTER DELETE ON places
BEGIN
  DELETE FROM place_search_entries WHERE place_id = OLD.id;
END;

CREATE TRIGGER place_search_entries_after_identifier_insert
AFTER INSERT ON place_identifiers
BEGIN
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (
    NEW.place_id, 'official_identifier', NEW.identifier, TRIM(NEW.identifier),
    NEW.authority, 1, 0
  );
END;

CREATE TRIGGER place_search_entries_after_identifier_update
AFTER UPDATE OF place_id, identifier, authority ON place_identifiers
BEGIN
  DELETE FROM place_search_entries
  WHERE place_id = OLD.place_id
    AND entry_type = 'official_identifier'
    AND normalized_value = TRIM(OLD.identifier) COLLATE NOCASE
    AND authority = OLD.authority;
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (
    NEW.place_id, 'official_identifier', NEW.identifier, TRIM(NEW.identifier),
    NEW.authority, 1, 0
  );
END;

CREATE TRIGGER place_search_entries_after_identifier_delete
AFTER DELETE ON place_identifiers
BEGIN
  DELETE FROM place_search_entries
  WHERE place_id = OLD.place_id
    AND entry_type = 'official_identifier'
    AND normalized_value = TRIM(OLD.identifier) COLLATE NOCASE
    AND authority = OLD.authority;
END;

CREATE TRIGGER place_search_entries_after_name_insert
AFTER INSERT ON place_names
BEGIN
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (
    NEW.place_id, 'alias', NEW.name, TRIM(NEW.name), '', NEW.is_primary, 3
  );
END;

CREATE TRIGGER place_search_entries_after_name_update
AFTER UPDATE OF place_id, name, is_primary ON place_names
BEGIN
  DELETE FROM place_search_entries
  WHERE place_id = OLD.place_id
    AND entry_type = 'alias'
    AND normalized_value = TRIM(OLD.name) COLLATE NOCASE;
  INSERT OR IGNORE INTO place_search_entries
    (place_id, entry_type, display_value, normalized_value, authority,
      is_primary, ranking_weight)
  VALUES (
    NEW.place_id, 'alias', NEW.name, TRIM(NEW.name), '', NEW.is_primary, 3
  );
END;

CREATE TRIGGER place_search_entries_after_name_delete
AFTER DELETE ON place_names
BEGIN
  DELETE FROM place_search_entries
  WHERE place_id = OLD.place_id
    AND entry_type = 'alias'
    AND normalized_value = TRIM(OLD.name) COLLATE NOCASE;
END;
