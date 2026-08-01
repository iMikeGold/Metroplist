export type StatisticType =
  | "total"
  | "ratio"
  | "percentage"
  | "rank"
  | "change"
  | "area";

export interface IndicatorPresentation {
  code: string;
  publicLabel: string;
  conciseLabel: string;
  statisticType: StatisticType;
  precision: number;
  directional: boolean;
  semanticDirection: "higher" | "lower" | null;
  sharePriority: number;
  visualForms: Array<"metric" | "difference" | "ratio" | "table" | "trend">;
  publishable: boolean;
  requiresProjectionWarning: boolean;
}

const presentations: Record<string, IndicatorPresentation> = {
  POP_TOTAL: {
    code: "POP_TOTAL",
    publicLabel: "Total population",
    conciseLabel: "Population",
    statisticType: "total",
    precision: 0,
    directional: true,
    semanticDirection: null,
    sharePriority: 100,
    visualForms: ["metric", "difference", "ratio", "table", "trend"],
    publishable: true,
    requiresProjectionWarning: true,
  },
  LAND_AREA_KM2: {
    code: "LAND_AREA_KM2",
    publicLabel: "Land area",
    conciseLabel: "Land area",
    statisticType: "area",
    precision: 2,
    directional: true,
    semanticDirection: null,
    sharePriority: 80,
    visualForms: ["metric", "difference", "ratio", "table"],
    publishable: true,
    requiresProjectionWarning: false,
  },
  POP_DENSITY_KM2: {
    code: "POP_DENSITY_KM2",
    publicLabel: "Population density",
    conciseLabel: "Density",
    statisticType: "ratio",
    precision: 1,
    directional: true,
    semanticDirection: null,
    sharePriority: 90,
    visualForms: ["metric", "difference", "ratio", "table", "trend"],
    publishable: true,
    requiresProjectionWarning: true,
  },
  CITY_BUILT_UP_AREA_KM2: {
    code: "CITY_BUILT_UP_AREA_KM2",
    publicLabel: "Built-up area",
    conciseLabel: "Built-up area",
    statisticType: "area",
    precision: 2,
    directional: true,
    semanticDirection: null,
    sharePriority: 70,
    visualForms: ["metric", "difference", "ratio", "table", "trend"],
    publishable: true,
    requiresProjectionWarning: true,
  },
  BUILT_UP_AREA_PER_PERSON: {
    code: "BUILT_UP_AREA_PER_PERSON",
    publicLabel: "Built-up area per person",
    conciseLabel: "Area per person",
    statisticType: "ratio",
    precision: 1,
    directional: true,
    semanticDirection: null,
    sharePriority: 60,
    visualForms: ["metric", "difference", "ratio", "table", "trend"],
    publishable: true,
    requiresProjectionWarning: true,
  },
};

export function indicatorPresentation(
  code: string,
  fallbackLabel: string,
): IndicatorPresentation {
  return presentations[code] ?? {
    code,
    publicLabel: fallbackLabel,
    conciseLabel: fallbackLabel,
    statisticType: "total",
    precision: 2,
    directional: false,
    semanticDirection: null,
    sharePriority: 10,
    visualForms: ["metric", "table"],
    publishable: false,
    requiresProjectionWarning: true,
  };
}

export function publishableIndicator(code: string): boolean {
  return indicatorPresentation(code, code).publishable;
}
