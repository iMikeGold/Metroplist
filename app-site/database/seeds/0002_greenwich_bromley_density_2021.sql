-- Controlled evidence slice. Source files were retrieved and reviewed on 2026-07-31.
-- TS001 publishes household and communal-establishment components. Metroplist
-- derives POP_TOTAL from those two observations before deriving density.
INSERT OR IGNORE INTO publishers (id, canonical_name, jurisdiction, publisher_type, website, authority_grade) VALUES
 ('pub_ons', 'Office for National Statistics', 'United Kingdom', 'national_statistics_institute', 'https://www.ons.gov.uk/', 'official');
INSERT OR IGNORE INTO datasets (id, publisher_id, canonical_title, licence, source_url) VALUES
 ('ds_ons_ts001_2021', 'pub_ons', 'TS001: Number of usual residents in households and communal establishments', 'Open Government Licence v3.0', 'https://www.ons.gov.uk/datasets/TS001/editions/2021/versions/3'),
 ('ds_ons_sam_2021', 'pub_ons', 'Standard Area Measurements for 2021 Statistical Geographies', 'Open Government Licence v3.0', 'https://www.data.gov.uk/dataset/37333f2d-e2c8-4c7d-888d-194119b65df0/standard-area-measurements-for-2021-statistical-geographies-march-2021-in-ew-v2');
INSERT OR IGNORE INTO dataset_releases (id, dataset_id, edition, version, release_date, coverage_start, coverage_end, retrieved_at, content_hash, status) VALUES
 ('rel_ons_ts001_2021_v3', 'ds_ons_ts001_2021', '2021', '3', '2023-01-30', '2021-03-21', '2021-03-21', '2026-07-31', 'sha256:a894a2e8b34c91561114f8124f74047675969b0d9c875c2669bc53a6b9e6acfa', 'validated'),
 ('rel_ons_sam_2021_v2', 'ds_ons_sam_2021', 'March 2021', 'V2', '2022-08-11', '2021-03-21', '2021-03-21', '2026-07-31', 'sha256:759351a082c0152efdade0a8bd6f70af8dd76f1785f8e977ec92f2ed21b60cb4', 'validated');
INSERT OR IGNORE INTO indicators (id, code, canonical_name, description, domain, measurement_type, default_unit_id, aggregation_rule, comparison_rule, status) VALUES
 ('ind_household_residents', 'POP_HOUSEHOLD_RESIDENTS', 'Household residents', 'TS001 source component used to derive total usual residents.', 'population', 'count', 'unit_people', 'sum with communal-establishment residents for POP_TOTAL', 'source component; not a public comparison indicator', 'supporting'),
 ('ind_communal_establishment_residents', 'POP_COMMUNAL_ESTABLISHMENT_RESIDENTS', 'Communal-establishment residents', 'TS001 source component used to derive total usual residents.', 'population', 'count', 'unit_people', 'sum with household residents for POP_TOTAL', 'source component; not a public comparison indicator', 'supporting');
INSERT OR IGNORE INTO places (id, slug, canonical_name, place_kind, country_code, parent_place_id, status, valid_from) VALUES
 ('place_england', 'england', 'England', 'country', 'GB-ENG', NULL, 'current', NULL),
 ('place_greater_london', 'greater-london', 'Greater London', 'region', 'GB-ENG', 'place_england', 'current', '1965-04-01'),
 ('place_greenwich_royal_borough', 'greenwich', 'Royal Borough of Greenwich', 'borough', 'GB-ENG', 'place_greater_london', 'current', '1965-04-01'),
 ('place_bromley_london_borough', 'bromley', 'London Borough of Bromley', 'borough', 'GB-ENG', 'place_greater_london', 'current', '1965-04-01');
INSERT OR IGNORE INTO place_names (id, place_id, name, name_type, country_context, is_primary) VALUES
 ('name_greenwich_primary', 'place_greenwich_royal_borough', 'Royal Borough of Greenwich', 'official', 'England', 1),
 ('name_greenwich_short', 'place_greenwich_royal_borough', 'Greenwich', 'short', 'London borough', 0),
 ('name_bromley_primary', 'place_bromley_london_borough', 'London Borough of Bromley', 'official', 'England', 1),
 ('name_bromley_short', 'place_bromley_london_borough', 'Bromley', 'short', 'London borough', 0);
INSERT OR IGNORE INTO place_identifiers (id, place_id, authority, scheme, identifier, source_release_id) VALUES
 ('pid_greenwich_ons', 'place_greenwich_royal_borough', 'ONS', 'GSS', 'E09000011', 'rel_ons_sam_2021_v2'),
 ('pid_bromley_ons', 'place_bromley_london_borough', 'ONS', 'GSS', 'E09000006', 'rel_ons_sam_2021_v2');
INSERT OR IGNORE INTO place_relationships (id, subject_place_id, relationship_type, object_place_id, confidence) VALUES
 ('rel_greenwich_london', 'place_greenwich_royal_borough', 'within', 'place_greater_london', 'verified'),
 ('rel_bromley_london', 'place_bromley_london_borough', 'within', 'place_greater_london', 'verified'),
 ('rel_london_england', 'place_greater_london', 'within', 'place_england', 'verified');
INSERT OR IGNORE INTO geographies (id, place_id, geography_type, administrative_level, authority, official_code, valid_from, status) VALUES
 ('geo_greenwich_ltla_2021', 'place_greenwich_royal_borough', 'London borough', 'lower-tier local authority', 'ONS', 'E09000011', '2021-03-21', 'current'),
 ('geo_bromley_ltla_2021', 'place_bromley_london_borough', 'London borough', 'lower-tier local authority', 'ONS', 'E09000006', '2021-03-21', 'current');
INSERT OR IGNORE INTO boundary_versions (id, geography_id, reference_date, reference_year, source_release_id, land_area_km2, total_area_km2, imported_at, licence) VALUES
 ('boundary_greenwich_2021', 'geo_greenwich_ltla_2021', '2021-03-21', 2021, 'rel_ons_sam_2021_v2', 47.3213, 50.3790, '2026-07-31', 'Open Government Licence v3.0'),
 ('boundary_bromley_2021', 'geo_bromley_ltla_2021', '2021-03-21', 2021, 'rel_ons_sam_2021_v2', 150.1562, 150.1562, '2026-07-31', 'Open Government Licence v3.0');
INSERT OR IGNORE INTO observations (id, geography_id, boundary_version_id, indicator_id, unit_id, dataset_release_id, value_numeric, reference_period_start, reference_period_end, reference_year, publication_date, ingested_at, verified_at, quality_status, preferred_status, evidence_status, methodology_version) VALUES
 ('obs_greenwich_household_pop_2021', 'geo_greenwich_ltla_2021', 'boundary_greenwich_2021', 'ind_household_residents', 'unit_people', 'rel_ons_ts001_2021_v3', 284650, '2021-03-21', '2021-03-21', 2021, '2023-01-30', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'TS001-v3 category 1: Lives in a household'),
 ('obs_greenwich_communal_pop_2021', 'geo_greenwich_ltla_2021', 'boundary_greenwich_2021', 'ind_communal_establishment_residents', 'unit_people', 'rel_ons_ts001_2021_v3', 4418, '2021-03-21', '2021-03-21', 2021, '2023-01-30', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'TS001-v3 category 2: Lives in a communal establishment'),
 ('obs_greenwich_land_2021', 'geo_greenwich_ltla_2021', 'boundary_greenwich_2021', 'ind_land_area_km2', 'unit_square_kilometre', 'rel_ons_sam_2021_v2', 47.3213, '2021-03-21', '2021-03-21', 2021, '2022-08-11', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'SAM CSV: Land Count (Area in KM2)'),
 ('obs_bromley_household_pop_2021', 'geo_bromley_ltla_2021', 'boundary_bromley_2021', 'ind_household_residents', 'unit_people', 'rel_ons_ts001_2021_v3', 328202, '2021-03-21', '2021-03-21', 2021, '2023-01-30', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'TS001-v3 category 1: Lives in a household'),
 ('obs_bromley_communal_pop_2021', 'geo_bromley_ltla_2021', 'boundary_bromley_2021', 'ind_communal_establishment_residents', 'unit_people', 'rel_ons_ts001_2021_v3', 1790, '2021-03-21', '2021-03-21', 2021, '2023-01-30', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'TS001-v3 category 2: Lives in a communal establishment'),
 ('obs_bromley_land_2021', 'geo_bromley_ltla_2021', 'boundary_bromley_2021', 'ind_land_area_km2', 'unit_square_kilometre', 'rel_ons_sam_2021_v2', 150.1562, '2021-03-21', '2021-03-21', 2021, '2022-08-11', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'SAM CSV: Land Count (Area in KM2)');
INSERT OR IGNORE INTO calculations (id, calculation_type, formula_code, formula_version, output_indicator_id, executed_at, input_manifest_json, output_value_numeric, output_unit_id) VALUES
 ('calc_greenwich_pop_total_2021', 'derived_observation', 'POP_HOUSEHOLD_RESIDENTS + POP_COMMUNAL_ESTABLISHMENT_RESIDENTS', '1', 'ind_population_total', '2026-07-31', '["obs_greenwich_household_pop_2021","obs_greenwich_communal_pop_2021"]', 289068, 'unit_people'),
 ('calc_bromley_pop_total_2021', 'derived_observation', 'POP_HOUSEHOLD_RESIDENTS + POP_COMMUNAL_ESTABLISHMENT_RESIDENTS', '1', 'ind_population_total', '2026-07-31', '["obs_bromley_household_pop_2021","obs_bromley_communal_pop_2021"]', 329992, 'unit_people'),
 ('calc_greenwich_density_2021', 'derived_observation', 'POP_TOTAL / LAND_AREA_KM2', '1', 'ind_population_density_km2', '2026-07-31', '["obs_greenwich_pop_2021","obs_greenwich_land_2021"]', 6108.623389467322, 'unit_people_per_square_kilometre'),
 ('calc_bromley_density_2021', 'derived_observation', 'POP_TOTAL / LAND_AREA_KM2', '1', 'ind_population_density_km2', '2026-07-31', '["obs_bromley_pop_2021","obs_bromley_land_2021"]', 2197.6581719569353, 'unit_people_per_square_kilometre');
INSERT OR IGNORE INTO observations (id, geography_id, boundary_version_id, indicator_id, unit_id, value_numeric, reference_period_start, reference_period_end, reference_year, publication_date, ingested_at, verified_at, quality_status, preferred_status, evidence_status, methodology_version) VALUES
 ('obs_greenwich_pop_2021', 'geo_greenwich_ltla_2021', 'boundary_greenwich_2021', 'ind_population_total', 'unit_people', 289068, '2021-03-21', '2021-03-21', 2021, '2026-07-31', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'Metroplist population aggregation formula v1'),
 ('obs_bromley_pop_2021', 'geo_bromley_ltla_2021', 'boundary_bromley_2021', 'ind_population_total', 'unit_people', 329992, '2021-03-21', '2021-03-21', 2021, '2026-07-31', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'Metroplist population aggregation formula v1'),
 ('obs_greenwich_density_2021', 'geo_greenwich_ltla_2021', 'boundary_greenwich_2021', 'ind_population_density_km2', 'unit_people_per_square_kilometre', 6108.623389467322, '2021-03-21', '2021-03-21', 2021, '2026-07-31', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'Metroplist density formula v1'),
 ('obs_bromley_density_2021', 'geo_bromley_ltla_2021', 'boundary_bromley_2021', 'ind_population_density_km2', 'unit_people_per_square_kilometre', 2197.6581719569353, '2021-03-21', '2021-03-21', 2021, '2026-07-31', '2026-07-31', '2026-07-31', 'verified', 'preferred', 'reported', 'Metroplist density formula v1');
INSERT OR IGNORE INTO calculation_inputs (id, calculation_id, observation_id, input_role) VALUES
 ('ci_greenwich_household', 'calc_greenwich_pop_total_2021', 'obs_greenwich_household_pop_2021', 'household_residents'), ('ci_greenwich_communal', 'calc_greenwich_pop_total_2021', 'obs_greenwich_communal_pop_2021', 'communal_establishment_residents'),
 ('ci_bromley_household', 'calc_bromley_pop_total_2021', 'obs_bromley_household_pop_2021', 'household_residents'), ('ci_bromley_communal', 'calc_bromley_pop_total_2021', 'obs_bromley_communal_pop_2021', 'communal_establishment_residents'),
 ('ci_greenwich_pop', 'calc_greenwich_density_2021', 'obs_greenwich_pop_2021', 'numerator'), ('ci_greenwich_area', 'calc_greenwich_density_2021', 'obs_greenwich_land_2021', 'denominator'),
 ('ci_bromley_pop', 'calc_bromley_density_2021', 'obs_bromley_pop_2021', 'numerator'), ('ci_bromley_area', 'calc_bromley_density_2021', 'obs_bromley_land_2021', 'denominator');
INSERT OR IGNORE INTO observation_lineage (id, output_observation_id, input_observation_id, calculation_id, input_role) VALUES
 ('lin_greenwich_household', 'obs_greenwich_pop_2021', 'obs_greenwich_household_pop_2021', 'calc_greenwich_pop_total_2021', 'household_residents'), ('lin_greenwich_communal', 'obs_greenwich_pop_2021', 'obs_greenwich_communal_pop_2021', 'calc_greenwich_pop_total_2021', 'communal_establishment_residents'),
 ('lin_bromley_household', 'obs_bromley_pop_2021', 'obs_bromley_household_pop_2021', 'calc_bromley_pop_total_2021', 'household_residents'), ('lin_bromley_communal', 'obs_bromley_pop_2021', 'obs_bromley_communal_pop_2021', 'calc_bromley_pop_total_2021', 'communal_establishment_residents'),
 ('lin_greenwich_pop', 'obs_greenwich_density_2021', 'obs_greenwich_pop_2021', 'calc_greenwich_density_2021', 'numerator'), ('lin_greenwich_area', 'obs_greenwich_density_2021', 'obs_greenwich_land_2021', 'calc_greenwich_density_2021', 'denominator'),
 ('lin_bromley_pop', 'obs_bromley_density_2021', 'obs_bromley_pop_2021', 'calc_bromley_density_2021', 'numerator'), ('lin_bromley_area', 'obs_bromley_density_2021', 'obs_bromley_land_2021', 'calc_bromley_density_2021', 'denominator');
