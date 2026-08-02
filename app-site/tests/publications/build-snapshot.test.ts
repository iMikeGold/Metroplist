import { describe, expect, it } from "vitest";
import {
  buildPublicationReferences,
  buildSnapshotManifest,
} from "@/server/services";
import type {
  PlaceDetail,
  PlaceIndicatorEvidence,
  RegistryReadRepository,
} from "@/server/repositories";

function place(id: string, slug: string, name: string): PlaceDetail {
  return {
    id,
    slug,
    canonicalName: name,
    placeKind: "city",
    status: "current",
    countryCode: "GB",
    parentPlaceId: null,
    parentName: "United Kingdom",
    geographyTypes: ["city"],
    matchedBy: "slug",
    matchedValue: slug,
    matchClass: "exact",
    ambiguous: false,
    aliases: [],
    identifiers: [],
    centroid: null,
  };
}

function evidence(
  observationId: string,
  value: number,
  year = 2025,
): PlaceIndicatorEvidence {
  return {
    observationId,
    indicatorId: "ind_population_total",
    indicatorCode: "POP_TOTAL",
    indicatorName: "Total population",
    unit: "people",
    value,
    referenceYear: year,
    referencePeriodStart: null,
    referencePeriodEnd: null,
    methodologyVersion: "WUP 2025 city estimate v1",
    qualityStatus: "verified",
    preferredStatus: "preferred",
    estimate: true,
    observationStatus: "estimate",
    sourceReleaseId: "rel_wup_2025",
    geographyId: `geo-${observationId}`,
    geographyType: "city",
    calculationIds: [`calc-${observationId}`],
  };
}

const origin = place("place-origin", "manchester-wup-city", "Manchester");
const target = place("place-target", "london-wup-city", "London");
const duplicateName = place("place-other", "manchester-other", "Manchester");
const evidenceByPlace = new Map([
  [origin.id, [evidence("obs-origin", 2_800_000)]],
  [target.id, [evidence("obs-target", 9_800_000)]],
  [duplicateName.id, [evidence("obs-other", 100_000)]],
]);

const repository = {
  async findPlaceDetail(placeId: string) {
    return [origin, target, duplicateName].find((item) => item.id === placeId) ?? null;
  },
  async listPlaceIndicatorEvidence(placeId: string) {
    return evidenceByPlace.get(placeId) ?? [];
  },
} as RegistryReadRepository;

describe("server-built Snapshots", () => {
  it("preserves exact canonical places, evidence, calculations and deterministic language", async () => {
    const manifest = await buildSnapshotManifest(
      {
        snapshotType: "comparison",
        placeIds: [origin.id, target.id],
        observationIds: ["obs-origin", "obs-target"],
        contentMode: "full_comparison",
        preferredVariant: "landscape",
      },
      repository,
      "2026-08-01T12:00:00.000Z",
    );
    expect(manifest.places.map((item) => item.id)).toEqual([
      "place-origin",
      "place-target",
    ]);
    expect(manifest.observations.map((item) => item.observationId)).toEqual([
      "obs-origin",
      "obs-target",
    ]);
    expect(manifest.calculationReferences).toEqual([
      "calc-obs-origin",
      "calc-obs-target",
    ]);
    expect(manifest.summary).toContain("Manchester");
    expect(manifest.summary).toContain("London");
    expect(manifest.summary).toContain("2025");
    expect(manifest.summary).not.toMatch(/better|worse|caused/i);
  });

  it("does not collapse duplicate public names into one identity", async () => {
    const manifest = await buildSnapshotManifest(
      {
        snapshotType: "comparison",
        placeIds: [origin.id, duplicateName.id],
        observationIds: ["obs-origin", "obs-other"],
        contentMode: "key_finding",
        preferredVariant: "square",
      },
      repository,
      "2026-08-01T12:00:00.000Z",
    );
    expect(manifest.places.map((item) => item.id)).toEqual([
      "place-origin",
      "place-other",
    ]);
    expect(new Set(manifest.places.map((item) => item.slug)).size).toBe(2);
  });

  it("retains both selected observations while storing shared references once", async () => {
    const manifest = await buildSnapshotManifest(
      {
        snapshotType: "comparison",
        placeIds: [origin.id, target.id],
        observationIds: ["obs-origin", "obs-target"],
        contentMode: "full_comparison",
        preferredVariant: "landscape",
      },
      repository,
      "2026-08-01T12:00:00.000Z",
    );
    const references = buildPublicationReferences(manifest);
    expect(
      references.filter((reference) => reference.referenceType === "place"),
    ).toHaveLength(2);
    expect(
      references.filter((reference) => reference.referenceType === "observation"),
    ).toHaveLength(2);
    expect(
      references.filter((reference) => reference.referenceType === "indicator"),
    ).toEqual([
      expect.objectContaining({
        referenceId: "ind_population_total",
        referenceRole: "published_indicator",
      }),
    ]);
    expect(
      references.filter((reference) => reference.referenceType === "source_release"),
    ).toEqual([
      expect.objectContaining({ referenceId: "rel_wup_2025" }),
    ]);
    expect(references.map((reference) => reference.ordinal)).toEqual(
      references.map((_, index) => index),
    );
  });

  it("rejects unknown ownership and incompatible evidence", async () => {
    await expect(
      buildSnapshotManifest(
        {
          snapshotType: "place_profile",
          placeIds: [origin.id],
          observationIds: ["obs-target"],
          contentMode: "place_summary",
          preferredVariant: "landscape",
        },
        repository,
      ),
    ).rejects.toThrow(/does not belong/);
    await expect(
      buildSnapshotManifest(
        {
          snapshotType: "comparison",
          placeIds: [origin.id, target.id],
          observationIds: ["obs-origin", "obs-target"],
          contentMode: "full_comparison",
          preferredVariant: "landscape",
        },
        {
          ...repository,
          async listPlaceIndicatorEvidence(placeId: string) {
            return placeId === target.id
              ? [evidence("obs-target", 9_800_000, 2024)]
              : evidenceByPlace.get(placeId) ?? [];
          },
        },
      ),
    ).rejects.toThrow(/No compatible target evidence/);
  });

  it("requires evidence from both places before building a comparison Snapshot", async () => {
    await expect(
      buildSnapshotManifest(
        {
          snapshotType: "comparison",
          placeIds: [origin.id, target.id],
          observationIds: ["obs-origin"],
          contentMode: "full_comparison",
          preferredVariant: "landscape",
        },
        repository,
      ),
    ).rejects.toThrow("Comparison Snapshots require complete compatible evidence pairs.");
  });
});
