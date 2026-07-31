import { describe, expect, it } from "vitest";
import { compareDensityEvidence } from "@/server/services";
import { densityFixture, FixtureDensityRepository } from "../fixtures/density-evidence";
const repository = new FixtureDensityRepository();
describe("controlled density evidence", () => {
  it("derives density from declared population and land-area inputs", () => { expect(densityFixture.greenwich.density).toBeCloseTo(289068 / 47.3213); expect(densityFixture.bromley.density).toBeCloseTo(329992 / 150.1562); });
  it("reverses narrative math without duplicating evidence", async () => { const forward = await compareDensityEvidence("greenwich", "bromley", repository); const reverse = await compareDensityEvidence("bromley", "greenwich", repository); expect(forward.status).toBe("ok"); expect(reverse.status).toBe("ok"); if (forward.status === "ok" && reverse.status === "ok") { expect(forward.directional.absoluteDifference).toBeGreaterThan(0); expect(reverse.directional.absoluteDifference).toBe(forward.directional.absoluteDifference); expect(forward.directional.ratioOriginToTarget).toBeCloseTo(1 / reverse.directional.ratioOriginToTarget); expect(forward.canonicalComparisonKey).toBe(reverse.canonicalComparisonKey); expect(forward.origin.densityObservationId).toBe(reverse.target.densityObservationId); expect(forward.target.densityObservationId).toBe(reverse.origin.densityObservationId); } });
  it("returns an explicit missing-data state", async () => { expect((await compareDensityEvidence("greenwich", "unknown", repository)).status).toBe("verified_data_not_available"); });
});
