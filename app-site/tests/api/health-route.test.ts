import { beforeEach, describe, expect, it, vi } from "vitest";

const getRuntimeRepositories = vi.fn();
vi.mock("@/server/database", () => ({ getRuntimeRepositories }));

const coverage = {
  places: 8592,
  m49CountriesOrAreas: 248,
  populationLocations: 237,
  populationObservations: 17538,
  capitalRelationships: 210,
  firstPopulationYear: 1950,
  lastPopulationYear: 2023,
};

describe("health API", () => {
  beforeEach(() => getRuntimeRepositories.mockReset());

  it("reports a working runtime D1 binding", async () => {
    getRuntimeRepositories.mockResolvedValue({
      registry: { getCoverage: vi.fn().mockResolvedValue(coverage) },
    });
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      release: "0.2.0",
      runtimeDatabaseStatus: "bound",
      coverage,
    });
  });

  it("reports structured degraded health when D1 is unavailable", async () => {
    getRuntimeRepositories.mockResolvedValue({
      registry: {
        getCoverage: vi.fn().mockRejectedValue(new Error("D1 unavailable")),
      },
    });
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "degraded",
      runtimeDatabaseStatus: "unavailable",
    });
  });
});
