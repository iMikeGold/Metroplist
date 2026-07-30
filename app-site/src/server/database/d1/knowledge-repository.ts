import type { KnowledgeClaim } from "@/modules/knowledge";
import type { D1DatabaseLike } from "@/server/database/types";
import type { KnowledgeRepository } from "@/server/repositories";
export class D1KnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async listVerifiedClaimsForPlace(placeId: string) { const result = await this.db.prepare("SELECT c.id, c.knowledge_version_id, c.claim_text, c.claim_type, c.verification_status FROM claims c JOIN knowledge_versions v ON v.id = c.knowledge_version_id JOIN knowledge_entries e ON e.id = v.knowledge_entry_id WHERE e.subject_place_id = ? AND c.verification_status IN ('verified', 'qualified') ORDER BY v.version_number DESC, c.created_at").bind(placeId).all<Record<string, unknown>>(); return (result.results ?? []).map((r): KnowledgeClaim => ({ id: String(r.id), knowledgeVersionId: String(r.knowledge_version_id), claimText: String(r.claim_text), claimType: r.claim_type as KnowledgeClaim["claimType"], verificationStatus: r.verification_status as KnowledgeClaim["verificationStatus"] })); }
}
