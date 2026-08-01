import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("publication store migration", () => {
  it("passes the disposable SQLite integrity and immutability proof", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/verify-publication-store.mjs"],
      { encoding: "utf8" },
    );
    const result = JSON.parse(output);
    expect(result).toMatchObject({
      status: "passed",
      foreignKeyViolations: 0,
      immutableGuards: true,
      duplicateHashRejected: true,
      secondMigrationRejected: true,
      stagingResidue: 0,
    });
  });
});
