import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("publication and trust routes", () => {
  it("keeps canonical policy ownership cross-domain", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toContain("https://metroplist.com/");
    expect(config).toContain('"privacy"');
    expect(config).toContain('"terms"');
    const institutionalPages = readFileSync(
      "../main-site/src/content/institutional-pages.ts",
      "utf8",
    );
    for (const route of [
      "data-and-trust",
      "privacy",
      "cookies",
      "terms",
      "accessibility",
      "contact",
      "responsible-data-use",
      "licensing",
      "data-quality",
      "corrections",
    ]) {
      expect(institutionalPages).toMatch(
        new RegExp(`(?:^|\\n)\\s*(?:"${route}"|${route}):\\s*\\{`),
      );
    }
    const redirects = readFileSync("../main-site/public/_redirects", "utf8");
    expect(redirects).toContain(
      "/snapshot/* https://app.metroplist.com/snapshot/:splat 301",
    );
  });

  it("provides canonical Snapshot, export, image and embed surfaces", () => {
    for (const path of [
      "src/app/snapshot/[snapshotSlug]/page.tsx",
      "src/app/embed/snapshot/[snapshotSlug]/page.tsx",
      "src/app/snapshot/[snapshotSlug]/image/[variant]/route.tsx",
      "src/app/api/snapshots/[snapshotSlug]/csv/route.ts",
      "src/app/api/snapshots/[snapshotSlug]/json/route.ts",
    ]) {
      expect(readFileSync(path, "utf8").length).toBeGreaterThan(100);
    }
  });

  it("does not load social SDKs or trackers", () => {
    const share = readFileSync("src/components/snapshot-share-controls.tsx", "utf8");
    expect(share).not.toMatch(/sdk\.js|connect\.facebook|platform\.twitter|analytics/i);
    expect(share).toContain("navigator.share");
    expect(share).toContain("Copy link");
  });
});
