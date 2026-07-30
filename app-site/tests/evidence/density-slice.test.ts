import { describe, expect, it } from "vitest";
import { compareEvidence, densityEvidence } from "@/server/evidence/density-slice";
describe("controlled density evidence", () => {
  it("derives density from declared population and land-area inputs", () => { expect(densityEvidence.greenwich.density).toBeCloseTo(289068 / 47.3213); expect(densityEvidence.bromley.density).toBeCloseTo(329992 / 150.1562); });
  it("reverses narrative math without duplicating evidence", () => { const forward = compareEvidence("greenwich", "bromley"); const reverse = compareEvidence("bromley", "greenwich"); expect(forward.status).toBe("ok"); expect(reverse.status).toBe("ok"); if (forward.status === "ok" && reverse.status === "ok") { expect(forward.directional.absoluteDifference).toBeGreaterThan(0); expect(reverse.directional.absoluteDifference).toBe(forward.directional.absoluteDifference); expect(forward.directional.ratioOriginToTarget).toBeCloseTo(1 / reverse.directional.ratioOriginToTarget); expect(forward.canonicalComparisonKey).toBe(reverse.canonicalComparisonKey); expect(forward.origin.densityObservationId).toBe(reverse.target.densityObservationId); expect(forward.target.densityObservationId).toBe(reverse.origin.densityObservationId); } });
  it("returns an explicit missing-data state", () => { expect(compareEvidence("greenwich", "unknown").status).toBe("verified_data_not_available"); });
});
