INSERT OR IGNORE INTO map_layer_manifests (
  id,
  code,
  canonical_title,
  geography_type,
  boundary_source_disclosure,
  configuration_json,
  status
) VALUES (
  'map_layer_contextual_maplibre_demo',
  'CONTEXTUAL_MAPLIBRE_DEMO',
  'MapLibre demonstration basemap',
  'contextual',
  'The MapLibre demo style is a contextual basemap. Its display boundaries are not canonical Metroplist statistical geography boundaries.',
  '{"styleUrl":"https://demotiles.maplibre.org/style.json","library":"maplibre-gl","libraryVersion":"5.24.0"}',
  'active'
);
