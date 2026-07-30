import { describe, expect, it } from "vitest";
import type { Observation } from "@/modules/observations";
import { classifyTimelineAddition } from "@/modules/timelines";

const base: Observation = {
  id: "obs-2021",
  geographyId: "geo-greenwich",
  boundaryVersionId: "boundary-2021",
  indicatorId: "population",
  unitId: "people",
  datasetReleaseId: "release-2021",
  valueNumeric: 1,
  valueText: null,
  referencePeriodStart: null,
  referencePeriodEnd: null,
  referenceYear: 2021,
  publicationDate: "2022-01-01",
  ingestedAt: "2026-07-30T20:00:00+00:00",
  verifiedAt: null,
  qualityStatus: "verified",
  preferredStatus: "preferred",
  isEstimate: false,
  methodologyVersion: "v1",
};

describe("timeline rules", () => {
  it("treats a later year as an additional period, not a correction", () => {
    const next = { ...base, id: "obs-2026", referenceYear: 2026 };

    expect(classifyTimelineAddition({ previous: base, next })).toBe(
      "additional_period",
    );
  });

  it("preserves a boundary variant as a separate comparison frame", () => {
    const next = {
      ...base,
      id: "obs-2021-new-boundary",
      boundaryVersionId: "boundary-2026",
    };

    expect(classifyTimelineAddition({ previous: base, next })).toBe(
      "boundary_variant",
    );
  });

  it("requires a correction relationship to be declared", () => {
    const next = { ...base, id: "obs-2021-corrected", valueNumeric: 2 };

    expect(
      classifyTimelineAddition({
        previous: base,
        next,
        declaredRevisionType: "correction",
      }),
    ).toBe("correction");
  });
});
