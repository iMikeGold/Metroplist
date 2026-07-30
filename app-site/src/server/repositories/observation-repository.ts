import type { Observation } from "@/modules/observations";

export interface ObservationQuery {
  geographyId: string;
  indicatorId: string;
  referenceYear?: number;
  preferredOnly?: boolean;
}

export interface ObservationRepository {
  findObservationById(id: string): Promise<Observation | null>;
  listObservations(query: ObservationQuery): Promise<Observation[]>;
}
