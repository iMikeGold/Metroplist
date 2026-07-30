export const SCENARIO_STATUSES = [
  "research_candidate",
  "source_asserted_unverified",
  "verified",
  "retired",
] as const;

export type ScenarioStatus = (typeof SCENARIO_STATUSES)[number];

export interface ScenarioInput {
  key: string;
  valueNumeric: number | null;
  valueText: string | null;
  unitId: string | null;
  referenceYear: number | null;
  provenanceStatus:
    | "source_asserted_unverified"
    | "linked_canonical_observation"
    | "verified_derivation";
}

export interface ScenarioRelationship {
  densityReferenceCandidateKey: string;
  footprintCandidateKey: string;
  verificationStatus: "required" | "verified" | "qualified";
}
