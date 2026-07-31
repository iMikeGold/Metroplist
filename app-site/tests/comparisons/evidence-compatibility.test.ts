import { describe, expect, it } from "vitest";
import {
  assessEvidenceCompatibility,
  explainEvidenceIncompatibility,
  findNewestCompatibleEvidencePairs,
  type ComparableEvidence,
} from "@/modules/comparisons/evidence-compatibility";

const evidence: ComparableEvidence = {
  observationId: "origin-2021",
  indicatorCode: "POP_DENSITY_KM2",
  indicatorName: "Population density",
  unit: "people/km2",
  value: 100,
  referenceYear: 2021,
  referencePeriodStart: "2021-01-01",
  referencePeriodEnd: "2021-12-31",
  methodologyVersion: "density-v1",
  qualityStatus: "verified",
  preferredStatus: "preferred",
  estimate: false,
  observationStatus: "reported",
  sourceReleaseId: "source-a",
  geographyId: "country-geography",
  geographyType: "country",
};

describe("evidence comparison compatibility", () => {
  it("allows different place classes and source releases", () => {
    const target = {
      ...evidence,
      observationId: "target-2021",
      sourceReleaseId: "source-b",
      geographyId: "city-geography",
      geographyType: "city",
    };
    expect(findNewestCompatibleEvidencePairs([evidence], [target])).toEqual([
      { origin: evidence, target },
    ]);
  });

  it("chooses a shared earlier year instead of rejecting different latest years", () => {
    const origin2022 = { ...evidence, observationId: "origin-2022", referenceYear: 2022 };
    const target2020 = { ...evidence, observationId: "target-2020", referenceYear: 2020 };
    const target2021 = { ...evidence, observationId: "target-2021" };
    expect(
      findNewestCompatibleEvidencePairs(
        [origin2022, evidence],
        [target2021, target2020],
      )[0],
    ).toEqual({ origin: evidence, target: target2021 });
  });

  it("does not pair estimates with projections", () => {
    expect(findNewestCompatibleEvidencePairs(
      [{ ...evidence, estimate: true, observationStatus: "estimate" }],
      [{ ...evidence, observationId: "projection", observationStatus: "projection" }],
    )).toEqual([]);
  });

  it("breaks same-year ties deterministically by observation IDs", () => {
    const originB = { ...evidence, observationId: "origin-b" };
    const originA = { ...evidence, observationId: "origin-a" };
    const targetB = { ...evidence, observationId: "target-b" };
    const targetA = { ...evidence, observationId: "target-a" };
    expect(
      findNewestCompatibleEvidencePairs([originB, originA], [targetB, targetA])
        .map((pair) => `${pair.origin.observationId}:${pair.target.observationId}`),
    ).toEqual([
      "origin-a:target-a",
      "origin-a:target-b",
      "origin-b:target-a",
      "origin-b:target-b",
    ]);
  });

  it("reports the evidence dimensions that differ", () => {
    const target = {
      ...evidence,
      unit: "people/ha",
      referenceYear: 2022,
      methodologyVersion: "density-v2",
      estimate: true,
      observationStatus: "estimate" as const,
    };
    expect(assessEvidenceCompatibility(evidence, target).map((issue) => issue.dimension))
      .toEqual(["unit", "reference_year", "methodology", "observation_status"]);
    expect(explainEvidenceIncompatibility([evidence], [{
      ...evidence,
      referenceYear: 2022,
    }])).toEqual([
      "A common indicator exists.",
      "Reference years differ (2021 and 2022).",
    ]);
  });
});
