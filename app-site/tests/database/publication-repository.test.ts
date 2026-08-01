import { describe, expect, it } from "vitest";
import { D1PublicationRepository } from "@/server/database";
import type { SnapshotManifest } from "@/modules/publications";

const manifest: SnapshotManifest = {
  schemaVersion: 1,
  snapshotType: "place_profile",
  createdAt: "2026-08-01T12:00:00.000Z",
  title: "Manchester",
  summary: "Manchester population.",
  places: [{
    id: "place-a",
    slug: "manchester",
    name: "Manchester",
    placeType: "City",
    parentName: null,
  }],
  blocks: [{ id: "headline", type: "headline", text: "Manchester" }],
  observations: [{
    observationId: "obs-a",
    placeId: "place-a",
    indicatorId: "ind-a",
    indicatorCode: "POP_TOTAL",
    indicatorName: "Total population",
    value: 1,
    unit: "people",
    referenceYear: 2025,
    referencePeriodStart: null,
    referencePeriodEnd: null,
    evidenceStatus: "estimate",
    methodologyVersion: "v1",
    sourceReleaseId: "release-a",
    geographyType: "city",
    calculationIds: [],
  }],
  calculationReferences: [],
  sourceReferences: ["release-a"],
  methodologyReferences: ["v1"],
  presentation: {
    contentMode: "place_summary",
    preferredVariant: "landscape",
    selectedIndicatorCodes: ["POP_TOTAL"],
  },
  alternativeText: "Manchester population.",
  licenceContext: { summary: "Source terms apply.", sourceTermsRequired: true },
};

const snapshotRow = {
  id: "snapshot-a",
  public_slug: "ABC123",
  schema_version: 1,
  snapshot_type: "place_profile",
  title: manifest.title,
  summary: manifest.summary,
  manifest_json: JSON.stringify(manifest),
  content_hash: "sha256:a",
  canonical_url: "https://app.metroplist.com/snapshot/ABC123",
  created_at: manifest.createdAt,
  event_type: "published",
  related_snapshot_id: null,
  reason: null,
};

class Statement {
  values: unknown[] = [];
  constructor(
    readonly sql: string,
    private readonly row: Record<string, unknown> | null,
  ) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async first<T>() { return this.row as T | null; }
  async all<T>() {
    return {
      success: true,
      results: (this.sql.includes("publication_snapshot_references")
        ? []
        : this.sql.includes("SELECT s.public_slug")
          ? [{ public_slug: "ABC123", created_at: manifest.createdAt }]
          : []) as T[],
    };
  }
  async run<T>() { return { success: true, results: [] as T[] }; }
}

class Db {
  statements: Statement[] = [];
  constructor(private readonly row: Record<string, unknown> | null = snapshotRow) {}
  prepare(sql: string) {
    const statement = new Statement(
      sql,
      sql.includes("FROM publication_snapshots") ? this.row : null,
    );
    this.statements.push(statement);
    return statement;
  }
  async batch<T>() { return [] as { success: boolean; results: T[] }[]; }
}

describe("D1 publication repository", () => {
  it("binds opaque slugs and content hashes", async () => {
    const db = new Db();
    const repository = new D1PublicationRepository(db);
    await repository.findBySlug("ABC' OR 1=1");
    expect(db.statements[0].values).toEqual(["ABC' OR 1=1"]);
    expect(db.statements[0].sql).not.toContain("ABC' OR 1=1");
    await repository.findByContentHash("sha256:test");
    expect(db.statements[2].values).toEqual(["sha256:test"]);
  });

  it("bounds published-sitemap reads", async () => {
    const db = new Db(null);
    const repository = new D1PublicationRepository(db);
    const result = await repository.listPublishedSlugs(99_999);
    expect(db.statements[0].values).toEqual([10_000]);
    expect(result).toEqual([
      { publicSlug: "ABC123", createdAt: manifest.createdAt },
    ]);
  });

  it("deduplicates an existing content hash without writing", async () => {
    const db = new Db();
    const repository = new D1PublicationRepository(db);
    const result = await repository.create({
      id: "new",
      publicSlug: "NEW",
      manifest,
      contentHash: "sha256:a",
      canonicalUrl: "https://app.metroplist.com/snapshot/NEW",
      references: [],
    });
    expect(result.deduplicated).toBe(true);
    expect(result.snapshot.id).toBe("snapshot-a");
    expect(db.statements.every((statement) => !statement.sql.includes("INSERT INTO"))).toBe(true);
  });
});
