import { NextResponse } from "next/server";
import { getRuntimeRepositories } from "@/server/database";

export async function GET(
  _request: Request,
  context: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await context.params;
  const repositories = await getRuntimeRepositories();
  const place = await repositories.registry.findPlaceDetail(placeId);
  if (!place) {
    return NextResponse.json({ error: "Place not found." }, { status: 404 });
  }
  const indicators = await repositories.registry.listPlaceIndicators(placeId);
  return NextResponse.json({ place, indicators });
}
