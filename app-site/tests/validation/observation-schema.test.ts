import { describe, expect, it } from "vitest";
import { observationSchema } from "@/modules/observations";

describe("observation schema", () => {
  it("requires at least one value representation", () => {
    const result = observationSchema.safeParse({
      id: "obs-test",
      geographyId: "geo-test",
      boundaryVersionId: null,
      indicatorId: "indicator-test",
      unitId: "unit-test",
      datasetReleaseId: null,
      valueNumeric: null,
      valueText: null,
      referencePeriodStart: null,
      referencePeriodEnd: null,
      referenceYear: 2021,
      publicationDate: null,
      ingestedAt: "2026-07-30T20:00:00+00:00",
      verifiedAt: null,
      qualityStatus: "unverified",
      preferredStatus: "candidate",
      isEstimate: false,
      methodologyVersion: null,
    });

    expect(result.success).toBe(false);
  });
});
