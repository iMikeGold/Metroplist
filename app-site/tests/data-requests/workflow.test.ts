import { describe, expect, it } from "vitest";
import { canTransitionDataRequest } from "@/modules/data-requests";

describe("data request acquisition workflow", () => {
  it("permits the validated publication path", () => {
    expect(canTransitionDataRequest("requested", "place_resolved")).toBe(true);
    expect(canTransitionDataRequest("staged", "verified")).toBe(true);
    expect(canTransitionDataRequest("verified", "published")).toBe(true);
  });

  it("does not permit publication before verification", () => {
    expect(canTransitionDataRequest("requested", "published")).toBe(false);
    expect(canTransitionDataRequest("validation_failed", "published")).toBe(false);
  });
});
