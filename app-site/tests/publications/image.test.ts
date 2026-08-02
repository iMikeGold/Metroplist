import { describe, expect, it } from "vitest";
import {
  renderSnapshotImageSvg,
  snapshotImageDimensions,
} from "@/modules/publications/image";
import {
  readSnapshotSvg,
  snapshotPngFilename,
} from "@/modules/publications/client-image";
import type { PublicationSnapshot } from "@/server/repositories/publication-repository";

const snapshot = {
  publicSlug: "GEBGL8E8XM",
  title: "Manchester — city profile",
  summary: "A measured place profile with selected indicators.",
  manifest: {
    observations: [
      {
        observationId: "obs-1",
        indicatorName: "Total population",
        value: 2535427,
        unit: "People",
        referenceYear: 2025,
        evidenceStatus: "estimate",
      },
      {
        observationId: "obs-2",
        indicatorName: "Land area",
        value: 741,
        unit: "km²",
        referenceYear: 2025,
        evidenceStatus: "estimate",
      },
      {
        observationId: "obs-3",
        indicatorName: "Population density",
        value: 3421.63,
        unit: "people/km²",
        referenceYear: 2025,
        evidenceStatus: "estimate",
      },
      {
        observationId: "obs-4",
        indicatorName: "Built-up area",
        value: 168.35,
        unit: "km²",
        referenceYear: 2025,
        evidenceStatus: "estimate",
      },
      {
        observationId: "obs-5",
        indicatorName: "Built-up area per person",
        value: 66.4,
        unit: "m²/person",
        referenceYear: 2025,
        evidenceStatus: "estimate",
      },
    ],
  },
} as unknown as PublicationSnapshot;

describe("Snapshot image intermediate", () => {
  it("renders deterministic, escaped SVG at every publication size", () => {
    for (const variant of Object.keys(snapshotImageDimensions) as Array<keyof typeof snapshotImageDimensions>) {
      const svg = renderSnapshotImageSvg(snapshot, variant);
      expect(svg).toContain(`<svg xmlns="http://www.w3.org/2000/svg" width="${snapshotImageDimensions[variant].width}" height="${snapshotImageDimensions[variant].height}"`);
      if (variant === "landscape") {
        expect(svg).toContain("+ 1 more measurement on the full Snapshot");
      }
      expect(svg).toContain("Manchester — city profile");
      expect(svg).not.toContain("<script");
    }
  });

  it("wraps long card text into bounded SVG lines", () => {
    const svg = renderSnapshotImageSvg(
      {
        ...snapshot,
        title: "United Kingdom of Great Britain and Northern Ireland compared with a very long named place",
        summary: "A deliberately long evidence-led summary that must remain inside the fixed publication card rather than extending beyond its visible bounds.",
      },
      "square",
    );
    expect(svg).toContain("<tspan");
    expect(svg).toContain("…");
  });

  it("accepts only successful SVG image responses before client rasterisation", async () => {
    await expect(
      readSnapshotSvg(
        new Response("Worker exception", {
          status: 500,
          headers: { "content-type": "text/html" },
        }),
      ),
    ).rejects.toThrow("Snapshot image is unavailable.");
    await expect(
      readSnapshotSvg(
        new Response("not an image", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    ).rejects.toThrow("Snapshot image is unavailable.");
    const svg = await readSnapshotSvg(
      new Response("<svg />", {
        headers: { "content-type": "image/svg+xml; charset=utf-8" },
      }),
    );
    expect(svg.type).toContain("image/svg+xml");
  });

  it("uses PNG filenames for downloadable publication visuals", () => {
    expect(snapshotPngFilename("GEBGL8E8XM", "square")).toBe(
      "metroplist-GEBGL8E8XM-square.png",
    );
  });
});
