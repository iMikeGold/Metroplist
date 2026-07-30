export const MEASUREMENT_TYPES = [
  "count",
  "area",
  "density",
  "rate",
  "percentage",
  "currency",
  "index",
  "text",
] as const;

export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export interface Unit {
  id: string;
  code: string;
  canonicalName: string;
  symbol: string | null;
}

export interface Indicator {
  id: string;
  code: string;
  canonicalName: string;
  domain: string;
  measurementType: MeasurementType;
  defaultUnitId: string;
  status: "active" | "planned" | "retired";
  formulaCode: string | null;
}
