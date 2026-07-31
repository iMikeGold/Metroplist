export const DATA_REQUEST_STATUSES = [
  "requested",
  "place_resolved",
  "source_discovery",
  "source_found",
  "queued",
  "acquired",
  "staged",
  "validation_failed",
  "awaiting_review",
  "verified",
  "published",
  "unavailable",
] as const;

export type DataRequestStatus = (typeof DATA_REQUEST_STATUSES)[number];

export interface DataRequest {
  id: string;
  requestedPlaceAText: string | null;
  requestedPlaceBText: string | null;
  resolvedPlaceAId: string | null;
  resolvedPlaceBId: string | null;
  requestedIndicatorText: string | null;
  resolvedIndicatorId: string | null;
  status: DataRequestStatus;
  requestCount: number;
}
