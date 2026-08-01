import { ImageResponse } from "next/og";
import { formatMeasure } from "@/modules/places/presentation";
import { getPublicationRepository } from "@/server/database";

const dimensions = {
  landscape: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ snapshotSlug: string; variant: string }> },
) {
  const { snapshotSlug, variant } = await params;
  const size = dimensions[variant as keyof typeof dimensions];
  if (!size) return new Response("Image variant not found.", { status: 404 });
  const publications = await getPublicationRepository();
  const snapshot = publications
    ? await publications.findBySlug(snapshotSlug)
    : null;
  if (!snapshot) return new Response("Snapshot not found.", { status: 404 });
  const metricLimit = variant === "landscape" ? 4 : 6;
  const metrics = snapshot.manifest.observations.slice(0, metricLimit);
  const remainingMetricCount =
    snapshot.manifest.observations.length - metrics.length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07141c",
          color: "#f3f8f8",
          padding: variant === "story" ? "100px 82px" : "70px 74px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#a9d3df", fontSize: 28 }}>METROPLIST · {snapshot.publicSlug}</div>
          <div style={{ fontSize: variant === "landscape" ? 66 : 76, lineHeight: 1.05, marginTop: 36 }}>
            {snapshot.title}
          </div>
          <div style={{ color: "#c4d2d8", fontSize: 30, lineHeight: 1.35, marginTop: 28 }}>
            {snapshot.summary}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 22 }}>
          {metrics.map((metric) => (
            <div
              key={metric.observationId}
              style={{
                display: "flex",
                flexDirection: "column",
                width: metrics.length > 2 ? "47%" : "100%",
                borderTop: "2px solid #527f8c",
                paddingTop: 18,
              }}
            >
              <div style={{ color: "#a9b8be", fontSize: 22 }}>{metric.indicatorName}</div>
              <div style={{ fontSize: 38, marginTop: 8 }}>{formatMeasure(metric.value, metric.unit)}</div>
              <div style={{ color: "#a9b8be", fontSize: 20, marginTop: 8 }}>
                {metric.referenceYear} · {metric.evidenceStatus}
              </div>
            </div>
          ))}
          {remainingMetricCount > 0 ? (
            <div
              style={{
                color: "#c4d2d8",
                display: "flex",
                fontSize: 21,
                width: "100%",
              }}
            >
              + {remainingMetricCount} more measurement
              {remainingMetricCount === 1 ? "" : "s"} on the full Snapshot
            </div>
          ) : null}
        </div>
        <div style={{ color: "#a9b8be", display: "flex", justifyContent: "space-between", fontSize: 22 }}>
          <span>app.metroplist.com/snapshot/{snapshot.publicSlug}</span>
          <span>Sources and methodology on Snapshot</span>
        </div>
      </div>
    ),
    size,
  );
}
