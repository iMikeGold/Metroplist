export const CLAIM_TYPES = [
  "officially_reported_fact",
  "metroplist_calculation",
  "metroplist_interpretation",
  "historical_estimate",
  "contested_claim",
  "user_submitted_lead",
  "unverified_research_note",
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

export interface KnowledgeClaim {
  id: string;
  knowledgeVersionId: string;
  claimText: string;
  claimType: ClaimType;
  verificationStatus: "unverified" | "under_review" | "verified" | "qualified" | "rejected";
}
