export const COMPARISON_MODES = [
  "like_for_like",
  "approximate_equivalent",
  "nested_scale",
  "urban_form_contrast",
  "historical_contrast",
  "country_comparison",
  "illustrative_only",
  "not_comparable",
] as const;

export type ComparisonMode = (typeof COMPARISON_MODES)[number];

export interface DirectionalComparison {
  originValue: number;
  targetValue: number;
  absoluteDifference: number;
  ratioOriginToTarget: number;
  ratioTargetToOrigin: number;
  targetAsPercentOfOrigin: number;
  direction: "origin_higher" | "target_higher" | "equal";
}
