import { beforeEach, describe, expect, it, vi } from "vitest";

const getCloudflareContext = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

describe("optional publication runtime", () => {
  beforeEach(() => {
    getCloudflareContext.mockReset();
    vi.resetModules();
  });

  it("returns unavailable when Cloudflare context cannot be loaded", async () => {
    getCloudflareContext.mockRejectedValue(
      new Error("Cloudflare context is unavailable"),
    );
    const { getPublicationRepository } = await import(
      "@/server/database/publications-runtime"
    );

    await expect(getPublicationRepository()).resolves.toBeNull();
  });

  it("returns unavailable when PUBLICATIONS_DB is not bound", async () => {
    getCloudflareContext.mockResolvedValue({ env: {} });
    const { getPublicationRepository } = await import(
      "@/server/database/publications-runtime"
    );

    await expect(getPublicationRepository()).resolves.toBeNull();
  });
});
