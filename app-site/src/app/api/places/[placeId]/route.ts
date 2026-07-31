import { NextResponse } from "next/server";
import { getRuntimeRepositories } from "@/server/database";

export async function GET(
  _request: Request,
  context: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await context.params;
  const repositories = await getRuntimeRepositories();
  const place = await repositories.registry.findPlaceDetail(placeId);
  return place
    ? NextResponse.json(place)
    : NextResponse.json({ error: "Place not found." }, { status: 404 });
}
