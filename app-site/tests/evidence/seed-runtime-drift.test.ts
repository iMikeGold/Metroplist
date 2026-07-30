import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { densityEvidence } from "@/server/evidence/density-slice";

const seed = readFileSync("database/seeds/0002_greenwich_bromley_density_2021.sql", "utf8");

function expectSeedValue(id: string, value: number) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  expect(seed).toMatch(new RegExp(`'${escaped}'[^;]*?[, ]${value}(?:,|\\))`));
}

describe("Release 0.1 runtime fixture", () => {
  it.each(Object.values(densityEvidence))("matches canonical SQL for $slug", (place) => {
    expectSeedValue(`${place.slug === "greenwich" ? "obs_greenwich" : "obs_bromley"}_household_pop_2021`, place.householdPopulation);
    expectSeedValue(`${place.slug === "greenwich" ? "obs_greenwich" : "obs_bromley"}_communal_pop_2021`, place.communalPopulation);
    expectSeedValue(place.populationObservationId, place.population);
    expectSeedValue(place.areaObservationId, place.landAreaKm2);
    expectSeedValue(place.densityObservationId, place.density);
    expect(place.householdPopulation + place.communalPopulation).toBe(place.population);
  });
});
