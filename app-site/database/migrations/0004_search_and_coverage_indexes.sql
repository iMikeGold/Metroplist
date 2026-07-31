CREATE INDEX idx_observations_indicator_year_geography
  ON observations(indicator_id, reference_year, geography_id);

CREATE INDEX idx_place_identifiers_identifier_nocase
  ON place_identifiers(identifier COLLATE NOCASE, place_id);

CREATE INDEX idx_places_country_code
  ON places(country_code);
