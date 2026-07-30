import { describe, expect, it } from "vitest";
import {
  calculateDirectionalComparison,
  createCanonicalComparisonKey,
} from "@/modules/comparisons";

describe("density comparison", () => {
  it("reverses perspective without duplicating evidence", () => {
    const forward = calculateDirectionalComparison(6000, 2400);
    const reverse = calculateDirectionalComparison(2400, 6000);

    expect(forward.ratioOriginToTarget).toBe(2.5);
    expect(reverse.ratioOriginToTarget).toBe(0.4);
    expect(forward.ratioTargetToOrigin).toBe(reverse.ratioOriginToTarget);
  });

  it("creates the same canonical key in either route direction", () => {
    const forward = createCanonicalComparisonKey({
      indicatorId: "density",
      placeAId: "greenwich",
      placeBId: "bromley",
      observationAId: "obs-greenwich",
      observationBId: "obs-bromley",
    });

    const reverse = createCanonicalComparisonKey({
      indicatorId: "density",
      placeAId: "bromley",
      placeBId: "greenwich",
      observationAId: "obs-bromley",
      observationBId: "obs-greenwich",
    });

    expect(forward).toBe(reverse);
  });

  it("rejects zero-value ratios until an explicit presentation rule exists", () => {
    expect(() => calculateDirectionalComparison(10, 0)).toThrow(RangeError);
  });
});
