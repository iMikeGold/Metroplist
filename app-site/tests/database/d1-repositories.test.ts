import { describe, expect, it } from "vitest";
import { D1ObservationRepository, D1PlaceRepository, D1RegistryReadRepository } from "@/server/database";
class Statement { values: unknown[] = []; constructor(readonly sql: string) {} bind(...values: unknown[]) { this.values = values; return this; } async first<T>() { const row = this.sql.includes("FROM places") ? { id: "p", slug: "greenwich", canonical_name: "Royal Borough of Greenwich", place_kind: "borough", country_code: "GB-ENG", parent_place_id: null, status: "current", valid_from: null, valid_to: null } : null; return row as T | null; } async all<T>() { return { success: true, results: [] as T[] }; } async run<T>() { return { success: true, results: [] as T[] }; } }
class Db { statements: Statement[] = []; prepare(sql: string) { const statement = new Statement(sql); this.statements.push(statement); return statement; } async batch<T>() { return [] as { success: boolean; results: T[] }[]; } }
describe("D1 repositories", () => {
  it("binds place lookup values instead of interpolating SQL", async () => {
    const db = new Db();
    const repo = new D1PlaceRepository(db);
    const result = await repo.findPlaceBySlug("greenwich' OR 1=1");
    expect(result?.id).toBe("p");
    expect(db.statements[0].values).toEqual(["greenwich' OR 1=1"]);
    expect(db.statements[0].sql).not.toContain("OR 1=1");
  });

  it("binds official identifiers", async () => {
    const db = new Db();
    const repo = new D1PlaceRepository(db);
    await repo.findPlaceByOfficialIdentifier("ONS", "GSS", "E09000011");
    expect(db.statements[0].values).toEqual(["ONS", "GSS", "E09000011"]);
  });

  it("bounds alias search limits", async () => {
    const db = new Db();
    const repo = new D1PlaceRepository(db);
    await repo.searchPlaces("Green", 10000);
    expect(db.statements[0].values).toEqual(["Green%", "Green%", 50]);
  });

  it("binds and bounds deterministic registry search", async () => {
    const db = new Db();
    const repo = new D1RegistryReadRepository(db);
    await repo.searchPlaces({
      query: "Lon%' OR 1=1",
      limit: 999,
      countryCode: "gb",
      geographyType: "country_or_area",
    });
    expect(db.statements[0].values).toEqual([
      "Lon%' OR 1=1",
      "Lon%' OR 1=1",
      "Lon%' OR 1=1",
      "Lon%' OR 1=1",
      "Lon%' OR 1=1%",
      "Lon%' OR 1=1%",
      "GB",
      "GB",
      "country_or_area",
      "country_or_area",
      25,
    ]);
    expect(db.statements[0].sql).not.toContain("Lon%' OR 1=1");
    expect(db.statements[0].sql).toContain("ORDER BY r.rank");
  });

  it("uses indexed observation predicates and explicit preferred filtering", async () => {
    const db = new Db();
    const repo = new D1ObservationRepository(db);
    await repo.listObservations({
      geographyId: "g",
      indicatorId: "i",
      referenceYear: 2021,
      preferredOnly: true,
    });
    expect(db.statements[0].values).toEqual(["g", "i", 2021]);
    expect(db.statements[0].sql).toContain("preferred_status = 'preferred'");
  });
});
