import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SnapshotShareControls } from "@/components/snapshot-share-controls";
import { SnapshotView } from "@/components/snapshot-view";
import {
  getPublicationRepository,
  getRuntimeRepositories,
} from "@/server/database";

async function loadSnapshot(snapshotSlug: string) {
  const publications = await getPublicationRepository();
  return publications ? publications.findBySlug(snapshotSlug) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ snapshotSlug: string }>;
}): Promise<Metadata> {
  const { snapshotSlug } = await params;
  const snapshot = await loadSnapshot(snapshotSlug);
  if (!snapshot) return { title: "Snapshot unavailable", robots: { index: false } };
  const active = snapshot.status === "published";
  return {
    title: snapshot.title,
    description: snapshot.summary,
    alternates: { canonical: snapshot.canonicalUrl },
    robots: active ? undefined : { index: false, follow: true },
    openGraph: {
      title: snapshot.title,
      description: snapshot.summary,
      url: snapshot.canonicalUrl,
      type: "article",
      images: [{
        url: "/assets/favicons/grey_teal/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Metroplist",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: snapshot.title,
      description: snapshot.summary,
      images: ["/assets/favicons/grey_teal/android-chrome-512x512.png"],
    },
  };
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ snapshotSlug: string }>;
}) {
  const { snapshotSlug } = await params;
  const snapshot = await loadSnapshot(snapshotSlug);
  if (!snapshot) notFound();
  const repositories = await getRuntimeRepositories();
  const currentHistories = await Promise.all(
    snapshot.manifest.places.map((place) =>
      repositories.registry.listPlaceIndicatorEvidence(place.id),
    ),
  );
  const newerDataAvailable = snapshot.manifest.observations.some((observation) =>
    currentHistories
      .flat()
      .some(
        (current) =>
          current.indicatorCode === observation.indicatorCode &&
          current.referenceYear != null &&
          observation.referenceYear != null &&
          current.referenceYear > observation.referenceYear,
      ),
  );
  const reportParameters = new URLSearchParams({
    page: snapshot.canonicalUrl,
    snapshot_id: snapshot.id,
    observation_ids: snapshot.manifest.observations
      .map((observation) => observation.observationId)
      .join(","),
  });
  return (
    <main className="snapshot-page">
      <SnapshotView snapshot={snapshot} />
      {newerDataAvailable ? (
        <aside className="notice" role="status">
          Newer data are now available. This Snapshot continues to show the evidence originally published.
        </aside>
      ) : null}
      <SnapshotShareControls
        snapshotSlug={snapshot.publicSlug}
        title={snapshot.title}
        summary={snapshot.summary}
        canonicalUrl={snapshot.canonicalUrl}
      />
      <details className="provenance">
        <summary>Sources and methodology</summary>
        <p>Created {new Date(snapshot.createdAt).toLocaleDateString("en-GB")} · schema version {snapshot.schemaVersion}</p>
        <p>{snapshot.manifest.licenceContext.summary}</p>
        <ul>
          {snapshot.manifest.observations.map((observation) => (
            <li key={observation.observationId}>
              {observation.indicatorName} · {observation.referenceYear ?? "date unavailable"} · {observation.evidenceStatus}
              {observation.sourceReleaseId ? ` · ${observation.sourceReleaseId}` : ""}
            </li>
          ))}
        </ul>
      </details>
      <section className="embed-code">
        <h2>Embed this Snapshot</h2>
        <p>Use the read-only, responsive Metroplist embed.</p>
        <code>{`<iframe src="https://app.metroplist.com/embed/snapshot/${snapshot.publicSlug}" title="${snapshot.title.replaceAll('"', "&quot;")}" loading="lazy"></iframe>`}</code>
      </section>
      <nav className="record-actions">
        <Link href={`/report-data-issue?${reportParameters}`}>Report a data issue</Link>
      </nav>
    </main>
  );
}
