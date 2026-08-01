import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  contentHash,
  emailShareUrl,
  facebookShareUrl,
  linkedInShareUrl,
  snapshotCsv,
  snapshotManifestSchema,
  xShareUrl,
  type SnapshotManifest,
} from "@/modules/publications";

const manifest: SnapshotManifest = snapshotManifestSchema.parse({
  schemaVersion: 1,
  snapshotType: "place_profile",
  createdAt: "2026-08-01T12:00:00.000Z",
  title: "A place, with punctuation",
  summary: "A restrained summary.",
  places: [{
    id: "place-a",
    slug: "place-a",
    name: "A place, with punctuation",
    placeType: "City",
    parentName: null,
  }],
  blocks: [{ id: "headline", type: "headline", text: "A place profile" }],
  observations: [{
    observationId: "obs-a",
    placeId: "place-a",
    indicatorId: "ind-a",
    indicatorCode: "POP_TOTAL",
    indicatorName: "Total population",
    value: 1234,
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
  alternativeText: "A place population summary.",
  licenceContext: {
    summary: "Source terms apply.",
    sourceTermsRequired: true,
  },
});

describe("Snapshot schema and outputs", () => {
  it("canonicalises object keys and hashes identical content deterministically", async () => {
    expect(canonicalJson({ b: 2, a: { d: 4, c: 3 } })).toBe(
      '{"a":{"c":3,"d":4},"b":2}',
    );
    await expect(contentHash({ b: 2, a: 1 })).resolves.toBe(
      await contentHash({ a: 1, b: 2 }),
    );
  });

  it("exports exact evidence with escaped CSV and versioned JSON-safe data", () => {
    const csv = snapshotCsv("snapshot-a", manifest);
    expect(csv).toContain('"A place, with punctuation"');
    expect(csv).toContain("obs-a");
    expect(csv).toContain("release-a");
    expect(csv).not.toContain("null");
  });

  it("builds tracker-free platform fallbacks from the canonical URL", () => {
    const details = {
      title: manifest.title,
      summary: manifest.summary,
      url: "https://app.metroplist.com/snapshot/ABC123",
    };
    expect(emailShareUrl(details)).toMatch(/^mailto:\?/);
    expect(xShareUrl(details)).toContain("twitter.com/intent/tweet");
    expect(linkedInShareUrl(details)).toContain("linkedin.com/sharing/share-offsite");
    expect(facebookShareUrl(details)).toContain("facebook.com/sharer/sharer.php");
    for (const url of [
      emailShareUrl(details),
      xShareUrl(details),
      linkedInShareUrl(details),
      facebookShareUrl(details),
    ]) {
      expect(url).toContain(encodeURIComponent(details.url));
    }
  });
});
