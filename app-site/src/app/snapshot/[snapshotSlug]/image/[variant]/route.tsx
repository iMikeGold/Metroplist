import {
  renderSnapshotImageSvg,
  snapshotImageDimensions,
  type SnapshotImageVariant,
} from "@/modules/publications/image";
import { getPublicationRepository } from "@/server/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ snapshotSlug: string; variant: string }> },
) {
  const { snapshotSlug, variant } = await params;
  const imageVariant = variant as SnapshotImageVariant;
  if (!(imageVariant in snapshotImageDimensions)) {
    return new Response("Image variant not found.", { status: 404 });
  }
  const publications = await getPublicationRepository();
  const snapshot = publications
    ? await publications.findBySlug(snapshotSlug)
    : null;
  if (!snapshot) return new Response("Snapshot not found.", { status: 404 });
  return new Response(renderSnapshotImageSvg(snapshot, imageVariant), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, immutable",
    },
  });
}
