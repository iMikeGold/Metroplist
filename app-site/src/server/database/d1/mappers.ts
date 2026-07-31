import type { Geography, Place } from "@/modules/geography";
import type { Observation } from "@/modules/observations";

export function mapPlace(row: Record<string, unknown>): Place {
  return {
    id: String(row.id), slug: String(row.slug), canonicalName: String(row.canonical_name),
    placeKind: row.place_kind as Place["placeKind"], countryCode: row.country_code as string | null,
    parentPlaceId: row.parent_place_id as string | null, status: row.status as Place["status"],
    validFrom: row.valid_from as string | null, validTo: row.valid_to as string | null,
  };
}

export function mapGeography(row: Record<string, unknown>): Geography {
  return { id: String(row.id), placeId: String(row.place_id), geographyType: String(row.geography_type),
    administrativeLevel: row.administrative_level as string | null, validFrom: row.valid_from as string | null,
    validTo: row.valid_to as string | null };
}

export function mapObservation(row: Record<string, unknown>): Observation {
  return {
    id: String(row.id), geographyId: String(row.geography_id), boundaryVersionId: row.boundary_version_id as string | null,
    indicatorId: String(row.indicator_id), unitId: String(row.unit_id), datasetReleaseId: row.dataset_release_id as string | null,
    valueNumeric: row.value_numeric as number | null, valueText: row.value_text as string | null,
    referencePeriodStart: row.reference_period_start as string | null, referencePeriodEnd: row.reference_period_end as string | null,
    referenceYear: row.reference_year as number | null, publicationDate: row.publication_date as string | null,
    ingestedAt: String(row.ingested_at), verifiedAt: row.verified_at as string | null,
    qualityStatus: row.quality_status as Observation["qualityStatus"], preferredStatus: row.preferred_status as Observation["preferredStatus"],
    isEstimate: Number(row.is_estimate) === 1,
    evidenceStatus: row.evidence_status as Observation["evidenceStatus"],
    methodologyVersion: row.methodology_version as string | null,
  };
}
