import { NextResponse } from "next/server";
import { createSnapshotRequestSchema } from "@/modules/publications";
import {
  getPublicationRepository,
  getRuntimeRepositories,
} from "@/server/database";
import { createSnapshot, SnapshotValidationError } from "@/server/services";

const MAX_REQUEST_BYTES = 16_384;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Snapshot request is too large." },
      { status: 413 },
    );
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Valid JSON is required." }, { status: 400 });
  }
  const parsed = createSnapshotRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Snapshot request is invalid.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const publications = await getPublicationRepository();
  if (!publications) {
    return NextResponse.json(
      {
        error:
          "Snapshot publication is awaiting its dedicated publication-store binding.",
      },
      { status: 503 },
    );
  }
  try {
    const repositories = await getRuntimeRepositories();
    const result = await createSnapshot(
      parsed.data,
      repositories.registry,
      publications,
    );
    return NextResponse.json(
      {
        snapshotSlug: result.snapshot.publicSlug,
        canonicalUrl: result.snapshot.canonicalUrl,
        deduplicated: result.deduplicated,
      },
      { status: result.deduplicated ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof SnapshotValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Metroplist Snapshot creation failed", error);
    return NextResponse.json(
      { error: "The Snapshot could not be created. Please try again." },
      { status: 500 },
    );
  }
}
