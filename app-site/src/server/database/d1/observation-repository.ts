import type { D1DatabaseLike } from "@/server/database/types";
import type { ObservationQuery, ObservationRepository } from "@/server/repositories";
import { mapObservation } from "./mappers";

export class D1ObservationRepository implements ObservationRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async findObservationById(id: string) { const row = await this.db.prepare("SELECT * FROM observations WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>(); return row ? mapObservation(row) : null; }
  async listObservations(query: ObservationQuery) {
    const clauses = ["geography_id = ?", "indicator_id = ?"]; const values: unknown[] = [query.geographyId, query.indicatorId];
    if (query.referenceYear !== undefined) { clauses.push("reference_year = ?"); values.push(query.referenceYear); }
    if (query.preferredOnly) clauses.push("preferred_status = 'preferred' AND quality_status IN ('verified', 'qualified')");
    const result = await this.db.prepare(`SELECT * FROM observations WHERE ${clauses.join(" AND ")} ORDER BY reference_year DESC, verified_at DESC, created_at DESC`).bind(...values).all<Record<string, unknown>>();
    return (result.results ?? []).map(mapObservation);
  }
}
