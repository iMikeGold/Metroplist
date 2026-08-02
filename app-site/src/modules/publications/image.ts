import { formatMeasure } from "@/modules/places/presentation";
import type { PublicationSnapshot } from "@/server/repositories/publication-repository";

export const snapshotImageDimensions = {
  landscape: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;

export type SnapshotImageVariant = keyof typeof snapshotImageDimensions;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(value: string, maximumCharacters: number, maximumLines: number): string[] {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maximumCharacters || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maximumLines - 1) break;
  }
  if (line && lines.length < maximumLines) lines.push(line);
  const consumed = lines.join(" ").length;
  if (consumed < value.trim().length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\s+$/, "")}…`;
  }
  return lines;
}

function svgLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
): string {
  return lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
}

export function renderSnapshotImageSvg(
  snapshot: PublicationSnapshot,
  variant: SnapshotImageVariant,
): string {
  const { width, height } = snapshotImageDimensions[variant];
  const metricLimit = variant === "landscape" ? 4 : 6;
  const metrics = snapshot.manifest.observations.slice(0, metricLimit);
  const remaining = snapshot.manifest.observations.length - metrics.length;
  const padding = variant === "story" ? 82 : 70;
  const titleSize = variant === "landscape" ? 58 : 68;
  const metricWidth = metrics.length > 2 ? (width - padding * 2 - 22) / 2 : width - padding * 2;
  const metricStart = variant === "landscape"
    ? height - 300
    : variant === "square"
      ? height - 480
      : variant === "portrait"
        ? height - 560
        : height - 700;
  const titleLines = wrapText(snapshot.title, variant === "landscape" ? 34 : 30, 2);
  const summaryLines = wrapText(snapshot.summary, variant === "landscape" ? 86 : 70, 2);
  const metricMarkup = metrics.map((metric, index) => {
    const column = metrics.length > 2 ? index % 2 : 0;
    const row = metrics.length > 2 ? Math.floor(index / 2) : index;
    const x = padding + column * (metricWidth + 22);
    const y = metricStart + row * 104;
    return `<g><line x1="${x}" y1="${y}" x2="${x + metricWidth}" y2="${y}" stroke="#527f8c" stroke-width="2"/><text x="${x}" y="${y + 30}" fill="#a9b8be" font-size="20">${escapeXml(metric.indicatorName)}</text><text x="${x}" y="${y + 68}" fill="#f3f8f8" font-size="34">${escapeXml(formatMeasure(metric.value, metric.unit))}</text><text x="${x}" y="${y + 94}" fill="#a9b8be" font-size="17">${metric.referenceYear} · ${escapeXml(metric.evidenceStatus)}</text></g>`;
  }).join("");
  const omittedMarkup = remaining > 0
    ? `<text x="${padding}" y="${height - 92}" fill="#c4d2d8" font-size="18">+ ${remaining} more measurement${remaining === 1 ? "" : "s"} on the full Snapshot</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title summary"><rect width="100%" height="100%" fill="#07141c"/><text x="${padding}" y="${padding}" fill="#a9d3df" font-family="Arial, sans-serif" font-size="24">METROPLIST · ${escapeXml(snapshot.publicSlug)}</text><text id="title" x="${padding}" y="${padding + 70}" fill="#f3f8f8" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700">${svgLines(titleLines, padding, padding + 70, titleSize + 10)}</text><text id="summary" x="${padding}" y="${padding + 70 + titleSize * 2 + 18}" fill="#c4d2d8" font-family="Arial, sans-serif" font-size="24">${svgLines(summaryLines, padding, padding + 70 + titleSize * 2 + 18, 32)}</text>${metricMarkup}${omittedMarkup}<text x="${padding}" y="${height - 46}" fill="#a9b8be" font-family="Arial, sans-serif" font-size="16">app.metroplist.com/snapshot/${escapeXml(snapshot.publicSlug)} · Sources and methodology on Snapshot</text></svg>`;
}
