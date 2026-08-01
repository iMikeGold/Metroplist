import { indicatorPresentation } from "@/modules/indicators/publication";
import { formatMeasure } from "@/modules/places/presentation";
import type { SnapshotObservation, SnapshotPlace } from "./schema";

function statusPhrase(status: SnapshotObservation["evidenceStatus"]): string {
  if (status === "estimate") return "estimated";
  if (status === "projection") return "projected";
  if (status === "awaiting_review") return "provisional";
  return "reported";
}

export function placeProfileSummary(
  place: SnapshotPlace,
  observation: SnapshotObservation,
): string {
  const indicator = indicatorPresentation(
    observation.indicatorCode,
    observation.indicatorName,
  );
  const year = observation.referenceYear ? ` in ${observation.referenceYear}` : "";
  return `${place.name}'s ${statusPhrase(observation.evidenceStatus)} ${indicator.publicLabel.toLowerCase()} was ${formatMeasure(observation.value, observation.unit)}${year}.`;
}

export function comparisonSummary(
  originPlace: SnapshotPlace,
  targetPlace: SnapshotPlace,
  origin: SnapshotObservation,
  target: SnapshotObservation,
): string {
  const indicator = indicatorPresentation(origin.indicatorCode, origin.indicatorName);
  const ratio = target.value === 0 ? null : origin.value / target.value;
  const relationship =
    ratio == null
      ? `cannot be expressed as a ratio to`
      : `${ratio.toFixed(2)} times`;
  const year = origin.referenceYear ? ` in ${origin.referenceYear}` : "";
  const status =
    origin.evidenceStatus === target.evidenceStatus
      ? `${statusPhrase(origin.evidenceStatus)} `
      : "";
  return `${originPlace.name}'s ${status}${indicator.publicLabel.toLowerCase()} was ${relationship} ${targetPlace.name}'s${year}.`;
}
