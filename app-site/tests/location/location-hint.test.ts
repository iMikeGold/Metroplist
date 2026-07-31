import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestLocationHint } from "@/modules/location";

const getCloudflareContext = vi.fn();
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

describe("location hint contract", () => {
  beforeEach(() => {
    getCloudflareContext.mockReset();
  });

  it("returns controlled JSON when runtime context is unavailable", async () => {
    getCloudflareContext.mockRejectedValue(new Error("unsupported runtime"));
    const { GET } = await import("@/app/api/location-hint/route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      available: false,
      confirmationRequired: true,
      accuracyClass: "unavailable",
      reason: "Location hint is unavailable in this runtime.",
    });
  });

  it("handles a non-JSON response", async () => {
    const request = vi.fn(async () => new Response("unavailable", { status: 503 }));
    await expect(requestLocationHint(request as typeof fetch)).resolves.toMatchObject({
      available: false,
      confirmationRequired: true,
      accuracyClass: "unavailable",
    });
  });

  it("handles a network failure", async () => {
    const request = vi.fn(async () => {
      throw new Error("network");
    });
    await expect(requestLocationHint(request as typeof fetch)).resolves.toEqual({
      available: false,
      confirmationRequired: true,
      accuracyClass: "unavailable",
      reason: "Location hint request failed.",
    });
  });

  it("preserves a successful coarse hint as unconfirmed", async () => {
    const request = vi.fn(async () =>
      Response.json({
        available: true,
        countryCode: "GB",
        region: "England",
        city: "London",
        latitude: 51.5,
        longitude: -0.12,
        timezone: "Europe/London",
        cloudflareColo: "LHR",
      }),
    );
    await expect(requestLocationHint(request as typeof fetch)).resolves.toEqual({
      available: true,
      countryCode: "GB",
      region: "England",
      city: "London",
      latitude: 51.5,
      longitude: -0.12,
      timezone: "Europe/London",
      cloudflareColo: "LHR",
      resolutionMethod: "cloudflare_ip_geolocation",
      accuracyClass: "coarse_network_hint",
      confirmationRequired: true,
    });
  });
});
