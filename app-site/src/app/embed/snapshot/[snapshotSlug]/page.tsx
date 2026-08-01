import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SnapshotView } from "@/components/snapshot-view";
import { getPublicationRepository } from "@/server/database";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function SnapshotEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ snapshotSlug: string }>;
  searchParams: Promise<{ theme?: string }>;
}) {
  const { snapshotSlug } = await params;
  const { theme } = await searchParams;
  const publications = await getPublicationRepository();
  const snapshot = publications
    ? await publications.findBySlug(snapshotSlug)
    : null;
  if (!snapshot) notFound();
  return (
    <main className={`snapshot-embed ${theme === "light" ? "light" : "dark"}`}>
      <SnapshotView snapshot={snapshot} compact />
      <a href={snapshot.canonicalUrl} target="_blank" rel="noreferrer">
        View full Snapshot on Metroplist
      </a>
    </main>
  );
}
