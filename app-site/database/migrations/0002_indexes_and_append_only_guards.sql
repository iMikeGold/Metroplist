CREATE INDEX idx_place_names_name ON place_names(name);
CREATE INDEX idx_place_names_name_nocase ON place_names(name COLLATE NOCASE);
CREATE INDEX idx_place_names_place_id ON place_names(place_id);
CREATE INDEX idx_places_canonical_name_nocase ON places(canonical_name COLLATE NOCASE);
CREATE INDEX idx_place_identifiers_lookup
  ON place_identifiers(authority, scheme, identifier);
CREATE INDEX idx_place_relationships_subject
  ON place_relationships(subject_place_id, relationship_type);
CREATE INDEX idx_place_relationships_object
  ON place_relationships(object_place_id, relationship_type);
CREATE INDEX idx_geographies_place_id ON geographies(place_id);
CREATE INDEX idx_boundary_versions_geography_year
  ON boundary_versions(geography_id, reference_year);
CREATE INDEX idx_observations_lookup
  ON observations(geography_id, indicator_id, reference_year);
CREATE INDEX idx_observations_source_release
  ON observations(dataset_release_id);
CREATE INDEX idx_observation_status_history_current
  ON observation_status_history(observation_id, effective_at DESC);
CREATE INDEX idx_data_requests_status_count
  ON data_requests(status, request_count DESC);
CREATE INDEX idx_claims_verification
  ON claims(verification_status, claim_type);
CREATE INDEX idx_knowledge_entries_place
  ON knowledge_entries(subject_place_id);
CREATE INDEX idx_knowledge_versions_entry_version
  ON knowledge_versions(knowledge_entry_id, version_number DESC);
CREATE INDEX idx_validation_events_open
  ON validation_events(resolution_status, severity);

CREATE TRIGGER observations_prevent_update
BEFORE UPDATE ON observations
BEGIN
  SELECT RAISE(
    ABORT,
    'observations are append-only; add a revision or status-history record'
  );
END;

CREATE TRIGGER observations_prevent_delete
BEFORE DELETE ON observations
BEGIN
  SELECT RAISE(
    ABORT,
    'observations are append-only and cannot be deleted'
  );
END;

CREATE TRIGGER dataset_releases_prevent_delete
BEFORE DELETE ON dataset_releases
BEGIN
  SELECT RAISE(
    ABORT,
    'dataset releases are provenance records and cannot be deleted'
  );
END;

CREATE INDEX idx_research_source_links_source
  ON research_source_links(research_source_id, relationship_type);
CREATE INDEX idx_research_source_links_candidate
  ON research_source_links(candidate_key);
CREATE INDEX idx_composite_members_composite
  ON geographic_composite_members(composite_id, sort_order);
CREATE INDEX idx_scenario_inputs_scenario
  ON scenario_inputs(scenario_id, input_key);
CREATE INDEX idx_scenario_relationships_scenario
  ON scenario_relationships(scenario_id, relationship_role);
