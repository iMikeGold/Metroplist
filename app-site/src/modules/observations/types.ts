export const QUALITY_STATUSES = [
  "unverified",
  "under_review",
  "verified",
  "qualified",
  "rejected",
  "withdrawn",
] as const;

export const PREFERRED_STATUSES = [
  "candidate",
  "preferred",
  "previous",
  "not_preferred",
] as const;

export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type PreferredStatus = (typeof PREFERRED_STATUSES)[number];

export interface Observation {
  id: string;
  geographyId: string;
  boundaryVersionId: string | null;
  indicatorId: string;
  unitId: string;
  datasetReleaseId: string | null;
  valueNumeric: number | null;
  valueText: string | null;
  referencePeriodStart: string | null;
  referencePeriodEnd: string | null;
  referenceYear: number | null;
  publicationDate: string | null;
  ingestedAt: string;
  verifiedAt: string | null;
  qualityStatus: QualityStatus;
  preferredStatus: PreferredStatus;
  isEstimate: boolean;
  methodologyVersion: string | null;
}
