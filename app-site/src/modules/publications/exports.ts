import { publicPlaceType } from "@/modules/places/presentation";
import type { SnapshotManifest } from "./schema";

function csvCell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function snapshotCsv(
  snapshotId: string,
  manifest: SnapshotManifest,
): string {
  const header = [
    "snapshot_id",
    "place_id",
    "place_name",
    "place_type",
    "indicator_id",
    "indicator_name",
    "value",
    "unit",
    "reference_year",
    "evidence_status",
    "observation_id",
    "source_release",
    "snapshot_created_at",
  ];
  const places = new Map(manifest.places.map((place) => [place.id, place]));
  const rows = manifest.observations.map((observation) => {
    const place = places.get(observation.placeId);
    return [
      snapshotId,
      observation.placeId,
      place?.name ?? "",
      place ? publicPlaceType([place.placeType], place.placeType) : "",
      observation.indicatorId,
      observation.indicatorName,
      observation.value,
      observation.unit,
      observation.referenceYear,
      observation.evidenceStatus,
      observation.observationId,
      observation.sourceReleaseId,
      manifest.createdAt,
    ].map(csvCell).join(",");
  });
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

export function snapshotJson(
  snapshotId: string,
  manifest: SnapshotManifest,
): string {
  return JSON.stringify({ snapshotId, manifest }, null, 2);
}
