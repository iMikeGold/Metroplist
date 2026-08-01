import { snapshotCsv } from "@/modules/publications";
import { getPublicationRepository } from "@/server/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ snapshotSlug: string }> },
) {
  const { snapshotSlug } = await params;
  const publications = await getPublicationRepository();
  const snapshot = publications
    ? await publications.findBySlug(snapshotSlug)
    : null;
  if (!snapshot) return new Response("Snapshot not found.\n", { status: 404 });
  return new Response(snapshotCsv(snapshot.id, snapshot.manifest), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="metroplist-${snapshot.publicSlug}.csv"`,
    },
  });
}
