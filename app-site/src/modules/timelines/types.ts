import type { Observation } from "@/modules/observations";

export const TIMELINE_RELATIONSHIPS = [
  "additional_period",
  "correction",
  "rebase",
  "restatement",
  "boundary_variant",
  "parallel_version",
  "duplicate_candidate",
] as const;

export type TimelineRelationship = (typeof TIMELINE_RELATIONSHIPS)[number];

export interface TimelineAddition {
  previous: Observation;
  next: Observation;
  declaredRevisionType?: "correction" | "rebase" | "restatement" | null;
}
