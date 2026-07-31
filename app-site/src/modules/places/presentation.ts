const placeTypeLabels: Record<string, string> = {
  built_up_area_2021: "Built-up area",
  city: "City",
  country: "Country",
  country_or_area: "Country or territory",
  intermediate_region: "Intermediate region",
  lower_tier_local_authority: "Local authority",
  major_region: "World region",
  region: "Region",
  special_geographic_entity: "Geographic area",
  statistical_area: "Statistical area",
  subregion: "Subregion",
};

export function publicPlaceType(types: string[], fallback: string): string {
  const value = types[0] || fallback;
  return placeTypeLabels[value] ?? value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function publicUnit(unit: string): string {
  if (!unit || unit === "null" || unit === "People") return "people";
  if (unit === "people/km²") return "people per km²";
  return unit;
}

export function formatMeasure(value: number | null, unit: string): string {
  if (value == null) return "Not available";
  const digits = Number.isInteger(value) ? 0 : value < 1000 ? 3 : 1;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: digits })} ${publicUnit(unit)}`;
}
