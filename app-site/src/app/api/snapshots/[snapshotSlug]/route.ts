import { NextResponse } from "next/server";
import { getPublicationRepository } from "@/server/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ snapshotSlug: string }> },
) {
  const { snapshotSlug } = await params;
  const publications = await getPublicationRepository();
  if (!publications) {
    return NextResponse.json(
      { error: "Snapshot publication is unavailable in this runtime." },
      { status: 503 },
    );
  }
  const snapshot = await publications.findBySlug(snapshotSlug);
  return snapshot
    ? NextResponse.json(snapshot)
    : NextResponse.json({ error: "Snapshot not found." }, { status: 404 });
}
