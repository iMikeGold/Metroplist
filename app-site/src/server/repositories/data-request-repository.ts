import type { DataRequest } from "@/modules/data-requests";

export interface CreateDataRequestInput {
  requestedPlaceAText: string | null;
  requestedPlaceBText: string | null;
  resolvedPlaceAId: string | null;
  resolvedPlaceBId: string | null;
  requestedIndicatorText: string | null;
  resolvedIndicatorId: string | null;
}

export interface DataRequestRepository {
  createOrIncrement(input: CreateDataRequestInput): Promise<DataRequest>;
}
