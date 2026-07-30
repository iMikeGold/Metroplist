import type { ComparisonMode } from "./types";

export interface ComparisonFrame {
  sameIndicator: boolean;
  sameUnit: boolean;
  sameGeographyType: boolean;
  sameAdministrativeLevel: boolean;
  sameReferencePeriod: boolean;
  containsHistoricalEntity: boolean;
}

export function assessComparisonMode(frame: ComparisonFrame): ComparisonMode {
  if (!frame.sameIndicator || !frame.sameUnit) {
    return "not_comparable";
  }

  if (
    frame.sameGeographyType &&
    frame.sameAdministrativeLevel &&
    frame.sameReferencePeriod
  ) {
    return "like_for_like";
  }

  if (frame.containsHistoricalEntity) {
    return "historical_contrast";
  }

  if (frame.sameAdministrativeLevel) {
    return "approximate_equivalent";
  }

  return "illustrative_only";
}
