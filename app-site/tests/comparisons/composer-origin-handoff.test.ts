import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const comparePage = readFileSync("src/app/compare/page.tsx", "utf8");
const composer = readFileSync("src/app/compare/comparison-composer.tsx", "utf8");
const atlas = readFileSync("src/app/map/atlas-explorer.tsx", "utf8");
const placeRecord = readFileSync("src/app/place/[placeSlug]/page.tsx", "utf8");

describe("comparison origin handoff", () => {
  it("passes canonical slugs from every place entry point", () => {
    expect(atlas).toContain("/compare?origin=");
    expect(placeRecord).toContain("/compare?origin=");
    expect(atlas).not.toContain('href="/compare">Compare this place');
    expect(placeRecord).not.toContain('href="/compare">Compare this place');
  });

  it("resolves URL slugs into selected canonical places server-side", () => {
    expect(comparePage).toContain("findPlaceBySlug(originSlug)");
    expect(comparePage).toContain("findPlaceDetail(originPlace.id)");
    expect(comparePage).toContain("initialOrigin={initialOrigin}");
    expect(composer).toContain("useState<Candidate | null>(initialOrigin)");
    expect(composer).toContain('useState(initialOrigin?.canonicalName ?? "")');
  });

  it("keeps canonical origin and target slugs aligned when swapping", () => {
    expect(composer).toContain('parameters.set("origin", origin.slug)');
    expect(composer).toContain('parameters.set("target", target.slug)');
    expect(composer).toContain("updateComparisonUrl(target, origin)");
  });
});
