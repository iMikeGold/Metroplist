import type { DataRequest } from "@/modules/data-requests";
import type { D1DatabaseLike } from "@/server/database/types";
import type { CreateDataRequestInput, DataRequestRepository } from "@/server/repositories";

function map(row: Record<string, unknown>): DataRequest { return { id: String(row.id), requestedPlaceAText: row.requested_place_a_text as string | null, requestedPlaceBText: row.requested_place_b_text as string | null, resolvedPlaceAId: row.resolved_place_a_id as string | null, resolvedPlaceBId: row.resolved_place_b_id as string | null, requestedIndicatorText: row.requested_indicator_text as string | null, resolvedIndicatorId: row.resolved_indicator_id as string | null, status: row.status as DataRequest["status"], requestCount: Number(row.request_count) }; }
async function sha256(value: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
export class D1DataRequestRepository implements DataRequestRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async createOrIncrement(input: CreateDataRequestInput) {
    const normalized = [input.resolvedPlaceAId ?? input.requestedPlaceAText, input.resolvedPlaceBId ?? input.requestedPlaceBText].map((v) => v?.trim().toLowerCase() ?? "").sort();
    const indicator = (input.resolvedIndicatorId ?? input.requestedIndicatorText ?? "").trim().toLowerCase();
    const key = await sha256([...normalized, indicator].join("|"));
    await this.db.prepare("INSERT INTO data_requests (id, requested_place_a_text, requested_place_b_text, resolved_place_a_id, resolved_place_b_id, requested_indicator_text, resolved_indicator_id, deduplication_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(deduplication_key) DO UPDATE SET request_count = request_count + 1, last_requested_at = CURRENT_TIMESTAMP").bind(crypto.randomUUID(), input.requestedPlaceAText, input.requestedPlaceBText, input.resolvedPlaceAId, input.resolvedPlaceBId, input.requestedIndicatorText, input.resolvedIndicatorId, key).run();
    const row = await this.db.prepare("SELECT * FROM data_requests WHERE deduplication_key = ? LIMIT 1").bind(key).first<Record<string, unknown>>();
    if (!row) throw new Error("Data request write did not return a record."); return map(row);
  }
}
