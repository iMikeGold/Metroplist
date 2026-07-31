import { describe, expect, it } from "vitest";
import type {
  PlaceIndicatorEvidence,
  PlaceSearchResult,
  RegistryReadRepository,
} from "@/server/repositories";
import { compareSelectedEvidence } from "@/server/services";

const originPlace: PlaceSearchResult = {
  id: "place-country",
  slug: "country",
  canonicalName: "Country",
  placeKind: "country",
  status: "current",
  countryCode: "AA",
  parentPlaceId: null,
  parentName: null,
  geographyTypes: ["country"],
  matchedBy: "slug",
  matchedValue: "country",
  matchClass: "exact",
  ambiguous: false,
};

const targetPlace: PlaceSearchResult = {
  ...originPlace,
  id: "place-city",
  slug: "city",
  canonicalName: "City",
  placeKind: "city",
  geographyTypes: ["city"],
  matchedValue: "city",
};

function frame(
  observationId: string,
  geographyId: string,
  geographyType: string,
  value: number,
  sourceReleaseId: string,
): PlaceIndicatorEvidence {
  return {
    observationId,
    indicatorCode: "POP_DENSITY_KM2",
    indicatorName: "Population density",
    unit: "people/km²",
    value,
    referenceYear: 2021,
    referencePeriodStart: "2021-01-01",
    referencePeriodEnd: "2021-12-31",
    methodologyVersion: "density-v1",
    qualityStatus: "verified",
    preferredStatus: "preferred",
    estimate: false,
    observationStatus: "reported",
    sourceReleaseId,
    geographyId,
    geographyType,
  };
}

const originEvidence = frame(
  "obs-country-2021",
  "geo-country",
  "country",
  6000,
  "release-a",
);
const targetEvidence = frame(
  "obs-city-2021",
  "geo-city",
  "city",
  2400,
  "release-b",
);

function repository(
  targetOverride: PlaceIndicatorEvidence = targetEvidence,
): RegistryReadRepository {
  return {
    searchPlaces: async ({ query }) =>
      query === "country" ? [originPlace] : query === "city" ? [targetPlace] : [],
    listPlaceIndicatorEvidence: async (placeId) =>
      placeId === originPlace.id ? [originEvidence] : [targetOverride],
  } as RegistryReadRepository;
}

describe("selected evidence comparison", () => {
  it("reloads exact selected IDs and remains stable across refresh", async () => {
    const first = await compareSelectedEvidence(
      "country",
      "city",
      originEvidence.observationId,
      targetEvidence.observationId,
      repository(),
    );
    const refreshed = await compareSelectedEvidence(
      "country",
      "city",
      originEvidence.observationId,
      targetEvidence.observationId,
      repository(),
    );
    expect(first).toEqual(refreshed);
    expect(first.status).toBe("ok");
  });

  it("allows different geography classes and source releases", async () => {
    const result = await compareSelectedEvidence(
      "country",
      "city",
      originEvidence.observationId,
      targetEvidence.observationId,
      repository(),
    );
    expect(result.status).toBe("ok");
  });

  it("rejects tampered and incompatible selected IDs", async () => {
    await expect(compareSelectedEvidence(
      "country",
      "city",
      "not-an-origin-observation",
      targetEvidence.observationId,
      repository(),
    )).resolves.toMatchObject({ status: "evidence_not_found" });

    const incompatible = { ...targetEvidence, methodologyVersion: "density-v2" };
    await expect(compareSelectedEvidence(
      "country",
      "city",
      originEvidence.observationId,
      incompatible.observationId,
      repository(incompatible),
    )).resolves.toMatchObject({
      status: "not_comparable",
      issues: [{ dimension: "methodology" }],
    });
  });

  it("reverses ratio while preserving positive absolute difference and identity", async () => {
    const forward = await compareSelectedEvidence(
      "country",
      "city",
      originEvidence.observationId,
      targetEvidence.observationId,
      repository(),
    );
    const reverseRepository = {
      ...repository(),
      searchPlaces: async ({ query }: { query: string }) =>
        query === "city" ? [targetPlace] : query === "country" ? [originPlace] : [],
      listPlaceIndicatorEvidence: async (placeId: string) =>
        placeId === targetPlace.id ? [targetEvidence] : [originEvidence],
    } as RegistryReadRepository;
    const reverse = await compareSelectedEvidence(
      "city",
      "country",
      targetEvidence.observationId,
      originEvidence.observationId,
      reverseRepository,
    );
    expect(forward.status).toBe("ok");
    expect(reverse.status).toBe("ok");
    if (forward.status === "ok" && reverse.status === "ok") {
      expect(forward.directional.ratioOriginToTarget).toBeCloseTo(
        1 / reverse.directional.ratioOriginToTarget,
      );
      expect(forward.directional.absoluteDifference).toBeGreaterThan(0);
      expect(reverse.directional.absoluteDifference).toBe(
        forward.directional.absoluteDifference,
      );
      expect(reverse.canonicalComparisonKey).toBe(forward.canonicalComparisonKey);
    }
  });
});
