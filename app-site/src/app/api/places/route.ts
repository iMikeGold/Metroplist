import { NextResponse } from "next/server";
import { getRuntimeRepositories } from "@/server/database";

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const query = parameters.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json(
      { error: "The q parameter is required.", candidates: [] },
      { status: 400 },
    );
  }
  try {
    const repositories = await getRuntimeRepositories();
    const candidates = await repositories.registry.searchPlaces({
      query,
      limit: Number(parameters.get("limit") ?? 10),
      countryCode: parameters.get("country") ?? undefined,
      geographyType: parameters.get("geographyType") ?? undefined,
    });
    return NextResponse.json({
      query,
      ambiguous: candidates.length > 1,
      candidates,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Metroplist could not connect to the place registry.",
        code: "registry_unavailable",
        query,
        candidates: [],
      },
      { status: 503 },
    );
  }
}
