import { describe, expect, it, vi } from "vitest";
import { OnsApiClient } from "@/server/sources";

describe("ONS API client", () => {
  it("bounds catalogue pagination and encodes dataset paths", async () => {
    const request = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    const client = new OnsApiClient(request as typeof fetch);
    await client.listDatasets(10_000, -10);
    await client.listDimensions("a/b", "2021 edition", 4, 10_000);
    expect(request.mock.calls[0][0]).toBe(
      "https://api.beta.ons.gov.uk/v1/datasets?limit=500&offset=0",
    );
    expect(request.mock.calls[1][0]).toContain(
      "/datasets/a%2Fb/editions/2021%20edition/versions/4/dimensions?limit=500",
    );
  });

  it("rejects non-ONS download hosts", async () => {
    const client = new OnsApiClient();
    await expect(
      client.downloadCsv("https://example.com/result.csv"),
    ).rejects.toThrow("official HTTPS ONS host");
  });
});
