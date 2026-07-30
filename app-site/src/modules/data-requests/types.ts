export const DATA_REQUEST_STATUSES = [
  "requested",
  "place_resolution_required",
  "source_identified",
  "acquisition_pending",
  "under_review",
  "published",
  "unavailable",
  "methodologically_incompatible",
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
