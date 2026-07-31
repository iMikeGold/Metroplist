import type { DataRequestStatus } from "./types";

const transitions: Record<DataRequestStatus, readonly DataRequestStatus[]> = {
  requested: ["place_resolved", "source_discovery", "unavailable"],
  place_resolved: ["source_discovery", "unavailable"],
  source_discovery: ["source_found", "unavailable"],
  source_found: ["queued", "unavailable"],
  queued: ["acquired", "unavailable"],
  acquired: ["staged", "validation_failed"],
  staged: ["validation_failed", "awaiting_review", "verified"],
  validation_failed: ["queued", "unavailable"],
  awaiting_review: ["verified", "validation_failed", "unavailable"],
  verified: ["published"],
  published: [],
  unavailable: ["source_discovery"],
};

export function canTransitionDataRequest(
  from: DataRequestStatus,
  to: DataRequestStatus,
): boolean {
  return transitions[from].includes(to);
}
