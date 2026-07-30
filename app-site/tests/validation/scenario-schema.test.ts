import { describe, expect, it } from "vitest";
import { scenarioInputSchema } from "@/modules/scenarios";

describe("scenario input schema", () => {
  it("can preserve a source-asserted historical input without calling it verified", () => {
    const result = scenarioInputSchema.safeParse({
      key: "world_population",
      valueNumeric: 7_400_000_000,
      valueText: null,
      unitId: "unit_people",
      referenceYear: 2016,
      provenanceStatus: "source_asserted_unverified",
    });

    expect(result.success).toBe(true);
  });
});
