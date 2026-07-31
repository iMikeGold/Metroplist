export interface ComparableEvidence {
  observationId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  value: number | null;
  referenceYear: number | null;
  referencePeriodStart: string | null;
  referencePeriodEnd: string | null;
  methodologyVersion: string | null;
  qualityStatus: string;
  preferredStatus: string;
  estimate: boolean;
  observationStatus: "reported" | "estimate" | "projection" | "awaiting_review";
  sourceReleaseId: string | null;
  geographyId: string;
  geographyType: string;
}

export type CompatibilityDimension =
  | "indicator"
  | "unit"
  | "reference_year"
  | "methodology"
  | "observation_status";

export interface CompatibilityIssue {
  dimension: CompatibilityDimension;
  message: string;
}

export interface CompatibleEvidencePair {
  origin: ComparableEvidence;
  target: ComparableEvidence;
}

export function assessEvidenceCompatibility(
  origin: ComparableEvidence,
  target: ComparableEvidence,
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  if (origin.indicatorCode !== target.indicatorCode) {
    issues.push({ dimension: "indicator", message: "The indicators differ." });
  }
  if (origin.unit !== target.unit) {
    issues.push({
      dimension: "unit",
      message: `Units differ (${origin.unit} and ${target.unit}).`,
    });
  }
  if (origin.referenceYear !== target.referenceYear) {
    issues.push({
      dimension: "reference_year",
      message: `Reference years differ (${origin.referenceYear ?? "unknown"} and ${target.referenceYear ?? "unknown"}).`,
    });
  }
  if (origin.methodologyVersion !== target.methodologyVersion) {
    issues.push({
      dimension: "methodology",
      message: "Methodology versions differ.",
    });
  }
  if (
    origin.qualityStatus !== target.qualityStatus ||
    origin.preferredStatus !== target.preferredStatus ||
    origin.observationStatus !== target.observationStatus
  ) {
    issues.push({
      dimension: "observation_status",
      message: "Observation statuses differ.",
    });
  }
  return issues;
}

export function findNewestCompatibleEvidencePairs(
  originEvidence: ComparableEvidence[],
  targetEvidence: ComparableEvidence[],
): CompatibleEvidencePair[] {
  const pairs: CompatibleEvidencePair[] = [];
  for (const origin of originEvidence) {
    for (const target of targetEvidence) {
      if (assessEvidenceCompatibility(origin, target).length === 0) {
        pairs.push({ origin, target });
      }
    }
  }
  return pairs.sort((left, right) => {
    const yearDifference =
      (right.origin.referenceYear ?? Number.MIN_SAFE_INTEGER) -
      (left.origin.referenceYear ?? Number.MIN_SAFE_INTEGER);
    if (yearDifference !== 0) return yearDifference;
    const originDifference = left.origin.observationId.localeCompare(
      right.origin.observationId,
    );
    return originDifference !== 0
      ? originDifference
      : left.target.observationId.localeCompare(right.target.observationId);
  });
}

export function explainEvidenceIncompatibility(
  originEvidence: ComparableEvidence[],
  targetEvidence: ComparableEvidence[],
): string[] {
  const sharedCodes = originEvidence
    .map((evidence) => evidence.indicatorCode)
    .filter((code) => targetEvidence.some((evidence) => evidence.indicatorCode === code));
  if (sharedCodes.length === 0) {
    return ["The selected places do not have a shared published indicator."];
  }
  const messages = new Set<string>(["A common indicator exists."]);
  for (const code of sharedCodes) {
    const origins = originEvidence.filter((evidence) => evidence.indicatorCode === code);
    const targets = targetEvidence.filter((evidence) => evidence.indicatorCode === code);
    for (const origin of origins) {
      for (const target of targets) {
        for (const issue of assessEvidenceCompatibility(origin, target)) {
          messages.add(issue.message);
        }
      }
    }
  }
  return [...messages];
}
