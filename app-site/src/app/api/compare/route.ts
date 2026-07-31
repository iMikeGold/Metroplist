import { NextResponse } from "next/server";
import { getRuntimeRepositories } from "@/server/database";
import { compareDensityEvidence } from "@/server/services";

async function resolvePlace(
  token: string,
  repositories: Awaited<ReturnType<typeof getRuntimeRepositories>>,
) {
  const byId = await repositories.registry.findPlaceDetail(token);
  if (byId) return { place: byId, candidates: [byId] };
  const candidates = await repositories.registry.searchPlaces({
    query: token,
    limit: 10,
  });
  return {
    place: candidates.length === 1 ? candidates[0] : null,
    candidates,
  };
}

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const origin = parameters.get("origin")?.trim() ?? "";
  const target = parameters.get("target")?.trim() ?? "";
  const indicator = parameters.get("indicator")?.trim() ?? "";
  if (!origin || !target || !indicator) {
    return NextResponse.json(
      { error: "origin, target and indicator are required." },
      { status: 400 },
    );
  }
  if (indicator !== "POP_DENSITY_KM2") {
    return NextResponse.json({
      status: "missing",
      message: "Metroplist recognises this request but does not yet hold a verified result.",
      indicator,
    });
  }
  const repositories = await getRuntimeRepositories();
  const [resolvedOrigin, resolvedTarget] = await Promise.all([
    resolvePlace(origin, repositories),
    resolvePlace(target, repositories),
  ]);
  if (!resolvedOrigin.place || !resolvedTarget.place) {
    return NextResponse.json(
      {
        status: "ambiguous",
        originCandidates: resolvedOrigin.candidates,
        targetCandidates: resolvedTarget.candidates,
      },
      { status: 409 },
    );
  }
  const comparison = await compareDensityEvidence(
    resolvedOrigin.place.slug,
    resolvedTarget.place.slug,
    repositories.density,
  );
  return NextResponse.json(
    comparison ?? {
      status: "missing",
      message: "Metroplist recognises this request but does not yet hold a verified result.",
    },
  );
}
