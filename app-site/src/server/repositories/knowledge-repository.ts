import type { KnowledgeClaim } from "@/modules/knowledge";

export interface KnowledgeRepository {
  listVerifiedClaimsForPlace(placeId: string): Promise<KnowledgeClaim[]>;
}
