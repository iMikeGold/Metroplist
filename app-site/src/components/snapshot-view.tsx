import { formatMeasure } from "@/modules/places/presentation";
import type { PublicationSnapshot } from "@/server/repositories";

export function SnapshotView({
  snapshot,
  compact = false,
}: {
  snapshot: PublicationSnapshot;
  compact?: boolean;
}) {
  const observations = new Map(
    snapshot.manifest.observations.map((observation) => [
      observation.observationId,
      observation,
    ]),
  );
  const places = new Map(
    snapshot.manifest.places.map((place) => [place.id, place]),
  );
  return (
    <article className={compact ? "snapshot-view compact" : "snapshot-view"}>
      <header>
        <p className="eyebrow">Metroplist Snapshot · {snapshot.publicSlug}</p>
        <h1>{snapshot.title}</h1>
        <p className="lede">{snapshot.summary}</p>
      </header>
      {snapshot.status !== "published" ? (
        <aside className="snapshot-status" role="status">
          This Snapshot has been {snapshot.status}.
          {snapshot.statusReason ? ` ${snapshot.statusReason}` : ""}
        </aside>
      ) : null}
      <div className="snapshot-blocks">
        {snapshot.manifest.blocks.map((block) => {
          if (block.type === "metric_group") {
            return (
              <section key={block.id}>
                <h2>{block.title}</h2>
                <div className="snapshot-metrics">
                  {block.observationIds.map((id) => {
                    const observation = observations.get(id);
                    if (!observation) return null;
                    const place = places.get(observation.placeId);
                    return (
                      <div key={id}>
                        <span>{place?.name} · {observation.indicatorName}</span>
                        <strong>{formatMeasure(observation.value, observation.unit)}</strong>
                        <small>
                          {observation.referenceYear ?? "Date unavailable"} ·{" "}
                          {observation.evidenceStatus}
                        </small>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }
          if (block.type === "difference") {
            return (
              <section key={block.id}>
                <h2>Absolute difference</h2>
                <p className="snapshot-figure">
                  {formatMeasure(block.absoluteDifference, block.unit)}
                </p>
              </section>
            );
          }
          if (block.type === "ratio") {
            return (
              <section key={block.id}>
                <h2>Directional ratio</h2>
                <p className="snapshot-figure">{block.ratio.toFixed(2)}×</p>
              </section>
            );
          }
          if (block.type === "table") {
            return (
              <section key={block.id}>
                <h2>Data table</h2>
                <div className="table-scroll" tabIndex={0}>
                  <table>
                    <thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                    <tbody>
                      {block.rows.map((row, index) => (
                        <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          }
          if (block.type === "map") {
            return (
              <section key={block.id}>
                <h2>Mapped places</h2>
                <p>{block.placeIds.map((id) => places.get(id)?.name).filter(Boolean).join(" · ")}</p>
              </section>
            );
          }
          if (block.type === "source_note" || block.type === "methodology_note") {
            return <p key={block.id}>{block.text}</p>;
          }
          return null;
        })}
      </div>
    </article>
  );
}
