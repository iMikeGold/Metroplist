import type { Observation } from "@/modules/observations";
import type { TimelineAddition, TimelineRelationship } from "./types";

function periodKey(observation: Observation): string {
  return [
    observation.referencePeriodStart ?? "",
    observation.referencePeriodEnd ?? "",
    observation.referenceYear?.toString() ?? "",
  ].join(":");
}

export function classifyTimelineAddition({
  previous,
  next,
  declaredRevisionType = null,
}: TimelineAddition): TimelineRelationship {
  if (previous.id === next.id) {
    return "duplicate_candidate";
  }

  if (periodKey(previous) !== periodKey(next)) {
    return "additional_period";
  }

  if (previous.boundaryVersionId !== next.boundaryVersionId) {
    return "boundary_variant";
  }

  if (declaredRevisionType) {
    return declaredRevisionType;
  }

  return "parallel_version";
}

export function selectPreferredObservation(
  observations: readonly Observation[],
): Observation | null {
  const verifiedPreferred = observations.find(
    (observation) =>
      observation.qualityStatus === "verified" &&
      observation.preferredStatus === "preferred",
  );

  if (verifiedPreferred) {
    return verifiedPreferred;
  }

  return (
    observations.find(
      (observation) => observation.preferredStatus === "preferred",
    ) ?? null
  );
}
