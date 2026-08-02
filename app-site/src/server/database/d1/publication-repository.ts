import {
  snapshotManifestSchema,
  type SnapshotStatus,
  type SnapshotType,
} from "@/modules/publications";
import type { D1DatabaseLike } from "@/server/database/types";
import type {
  CreatePublicationSnapshot,
  PublicationReference,
  PublicationRepository,
  PublicationSnapshot,
} from "@/server/repositories";

interface Row {
  [key: string]: unknown;
}

function assertUniqueReferences(references: PublicationReference[]): void {
  const seen = new Set<string>();
  for (const reference of references) {
    const key = [
      reference.referenceType,
      reference.referenceId,
      reference.referenceRole,
    ].join("\u001f");
    if (seen.has(key)) {
      throw new Error("Snapshot references must be unique before publication.");
    }
    seen.add(key);
  }
}

function mapReference(row: Row): PublicationReference {
  return {
    referenceType: String(row.reference_type) as PublicationReference["referenceType"],
    referenceId: String(row.reference_id),
    referenceRole: String(row.reference_role),
    ordinal: Number(row.ordinal),
  };
}

export class D1PublicationRepository implements PublicationRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  private async hydrate(row: Row): Promise<PublicationSnapshot> {
    const references = await this.db
      .prepare(`
        SELECT reference_type, reference_id, reference_role, ordinal
        FROM publication_snapshot_references
        WHERE snapshot_id = ?
        ORDER BY ordinal, reference_type, reference_id`)
      .bind(String(row.id))
      .all<Row>();
    return {
      id: String(row.id),
      publicSlug: String(row.public_slug),
      schemaVersion: Number(row.schema_version),
      snapshotType: String(row.snapshot_type) as SnapshotType,
      title: String(row.title),
      summary: String(row.summary),
      manifest: snapshotManifestSchema.parse(JSON.parse(String(row.manifest_json))),
      contentHash: String(row.content_hash),
      canonicalUrl: String(row.canonical_url),
      createdAt: String(row.created_at),
      status: String(row.event_type ?? "published") as SnapshotStatus,
      relatedSnapshotId:
        row.related_snapshot_id == null ? null : String(row.related_snapshot_id),
      statusReason: row.reason == null ? null : String(row.reason),
      references: (references.results ?? []).map(mapReference),
    };
  }

  private baseQuery(predicate: string): string {
    return `
      SELECT s.*, e.event_type, e.related_snapshot_id, e.reason
      FROM publication_snapshots s
      LEFT JOIN publication_snapshot_events e ON e.id = (
        SELECT latest.id FROM publication_snapshot_events latest
        WHERE latest.snapshot_id = s.id
        ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1
      )
      WHERE ${predicate}
      LIMIT 1`;
  }

  async findBySlug(publicSlug: string): Promise<PublicationSnapshot | null> {
    const row = await this.db
      .prepare(this.baseQuery("s.public_slug = ?"))
      .bind(publicSlug)
      .first<Row>();
    return row ? this.hydrate(row) : null;
  }

  async findByContentHash(contentHash: string): Promise<PublicationSnapshot | null> {
    const row = await this.db
      .prepare(this.baseQuery("s.content_hash = ?"))
      .bind(contentHash)
      .first<Row>();
    return row ? this.hydrate(row) : null;
  }

  async listPublishedSlugs(
    limit: number,
  ): Promise<Array<{ publicSlug: string; createdAt: string }>> {
    const boundedLimit = Math.max(1, Math.min(10_000, Math.trunc(limit)));
    const result = await this.db
      .prepare(`
        SELECT s.public_slug, s.created_at
        FROM publication_snapshots s
        WHERE COALESCE((
          SELECT latest.event_type FROM publication_snapshot_events latest
          WHERE latest.snapshot_id = s.id
          ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1
        ), 'published') = 'published'
        ORDER BY s.created_at DESC, s.public_slug
        LIMIT ?`)
      .bind(boundedLimit)
      .all<Row>();
    return (result.results ?? []).map((row) => ({
      publicSlug: String(row.public_slug),
      createdAt: String(row.created_at),
    }));
  }

  async create(
    input: CreatePublicationSnapshot,
  ): Promise<{ snapshot: PublicationSnapshot; deduplicated: boolean }> {
    assertUniqueReferences(input.references);
    const existing = await this.findByContentHash(input.contentHash);
    if (existing) return { snapshot: existing, deduplicated: true };
    const manifestJson = JSON.stringify(input.manifest);
    const statements = [
      this.db
        .prepare(`
          INSERT INTO publication_snapshots (
            id, public_slug, schema_version, snapshot_type, title, summary,
            manifest_json, content_hash, canonical_url, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          input.id,
          input.publicSlug,
          input.manifest.schemaVersion,
          input.manifest.snapshotType,
          input.manifest.title,
          input.manifest.summary,
          manifestJson,
          input.contentHash,
          input.canonicalUrl,
          input.manifest.createdAt,
        ),
      ...input.references.map((reference) =>
        this.db
          .prepare(`
            INSERT INTO publication_snapshot_references (
              id, snapshot_id, reference_type, reference_id, reference_role, ordinal
            ) VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(
            `snapshot_ref_${crypto.randomUUID()}`,
            input.id,
            reference.referenceType,
            reference.referenceId,
            reference.referenceRole,
            reference.ordinal,
          ),
      ),
      this.db
        .prepare(`
          INSERT INTO publication_snapshot_events (
            id, snapshot_id, event_type, related_snapshot_id, reason, created_at
          ) VALUES (?, ?, 'published', NULL, NULL, ?)`)
        .bind(
          `snapshot_event_${crypto.randomUUID()}`,
          input.id,
          input.manifest.createdAt,
        ),
    ];
    const results = await this.db.batch(statements);
    if (results.some((result) => !result.success)) {
      throw new Error("Snapshot publication transaction failed.");
    }
    const snapshot = await this.findBySlug(input.publicSlug);
    if (!snapshot) throw new Error("Published Snapshot could not be reloaded.");
    return { snapshot, deduplicated: false };
  }

  async withdraw(snapshotId: string, reason: string, createdAt: string): Promise<void> {
    const result = await this.db
      .prepare(`
        INSERT INTO publication_snapshot_events (
          id, snapshot_id, event_type, related_snapshot_id, reason, created_at
        ) VALUES (?, ?, 'withdrawn', NULL, ?, ?)`)
      .bind(`snapshot_event_${crypto.randomUUID()}`, snapshotId, reason, createdAt)
      .run();
    if (!result.success) throw new Error("Snapshot withdrawal could not be recorded.");
  }

  async supersede(
    snapshotId: string,
    relatedSnapshotId: string,
    reason: string,
    createdAt: string,
  ): Promise<void> {
    const result = await this.db
      .prepare(`
        INSERT INTO publication_snapshot_events (
          id, snapshot_id, event_type, related_snapshot_id, reason, created_at
        ) VALUES (?, ?, 'superseded', ?, ?, ?)`)
      .bind(
        `snapshot_event_${crypto.randomUUID()}`,
        snapshotId,
        relatedSnapshotId,
        reason,
        createdAt,
      )
      .run();
    if (!result.success) throw new Error("Snapshot supersession could not be recorded.");
  }
}
