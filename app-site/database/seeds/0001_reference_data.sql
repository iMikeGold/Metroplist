INSERT OR IGNORE INTO units (id, code, canonical_name, symbol) VALUES
  ('unit_people', 'people', 'People', NULL),
  ('unit_square_kilometre', 'square_kilometre', 'Square kilometre', 'km²'),
  ('unit_people_per_square_kilometre', 'people_per_square_kilometre', 'People per square kilometre', 'people/km²'),
  ('unit_percent', 'percent', 'Percent', '%');

INSERT OR IGNORE INTO indicators (
  id,
  code,
  canonical_name,
  description,
  domain,
  measurement_type,
  default_unit_id,
  formula_code,
  comparison_rule,
  status
) VALUES
  (
    'ind_population_total',
    'POP_TOTAL',
    'Total population',
    'Population associated with a declared geography, period and source definition.',
    'population',
    'count',
    'unit_people',
    NULL,
    'compare only with declared geography, period and population definition',
    'active'
  ),
  (
    'ind_land_area_km2',
    'LAND_AREA_KM2',
    'Land area',
    'Land area associated with a declared boundary version.',
    'geography',
    'area',
    'unit_square_kilometre',
    NULL,
    'boundary version must be displayed',
    'active'
  ),
  (
    'ind_population_density_km2',
    'POP_DENSITY_KM2',
    'Population density',
    'Population divided by land area for declared observation and boundary versions.',
    'population',
    'density',
    'unit_people_per_square_kilometre',
    'POP_TOTAL / LAND_AREA_KM2',
    'unit, period, geography and boundary compatibility required',
    'active'
  ),
  (
    'ind_unemployment_rate',
    'UNEMPLOYMENT_RATE',
    'Unemployment rate',
    'Future indicator definition; no observations are seeded.',
    'economy',
    'percentage',
    'unit_percent',
    NULL,
    'methodology and population denominator must match',
    'planned'
  ),
  (
    'ind_net_migration_rate',
    'NET_MIGRATION_RATE',
    'Net migration rate',
    'Future indicator definition; no observations are seeded.',
    'population',
    'rate',
    'unit_people',
    NULL,
    'period, denominator and methodology must be declared',
    'planned'
  ),
  (
    'ind_green_space_percent',
    'GREEN_SPACE_PERCENT',
    'Green-space percentage',
    'Future indicator definition; no observations are seeded.',
    'environment',
    'percentage',
    'unit_percent',
    NULL,
    'land classification and boundary methodology must be declared',
    'planned'
  );
