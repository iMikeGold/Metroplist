import { describe, expect, it } from "vitest";
import { formatMeasure, publicPlaceType } from "@/modules/places/presentation";

describe("public place presentation", () => {
  it("never exposes storage enum formatting", () => {
    expect(publicPlaceType(["country_or_area"], "country")).toBe("Country or territory");
    expect(publicPlaceType(["built_up_area_2021"], "statistical_area")).toBe("Built-up area");
    expect(publicPlaceType(["lower_tier_local_authority"], "district")).toBe("Local authority");
  });

  it("does not render null as a unit", () => {
    expect(formatMeasure(329_992, "null")).toBe("329,992 people");
    expect(formatMeasure(2_197.658, "people/km²")).toBe("2,197.7 people per km²");
  });
});
