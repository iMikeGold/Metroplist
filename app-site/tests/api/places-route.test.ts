import { describe, expect, it, vi } from "vitest";

const getRuntimeRepositories = vi.fn();
vi.mock("@/server/database", () => ({ getRuntimeRepositories }));

describe("place search API", () => {
  it("returns structured JSON when the registry repository fails", async () => {
    getRuntimeRepositories.mockRejectedValue(new Error("D1 unavailable"));
    const { GET } = await import("@/app/api/places/route");
    const response = await GET(
      new Request("https://metroplist.test/api/places?q=london"),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Metroplist could not connect to the place registry.",
      code: "registry_unavailable",
      query: "london",
      candidates: [],
    });
  });
});
