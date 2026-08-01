import { z } from "zod";

export const snapshotTypeSchema = z.enum([
  "place_profile",
  "comparison",
  "ranking",
  "trend",
  "map_extract",
  "collection",
  "indicator_profile",
]);

export const snapshotStatusSchema = z.enum([
  "published",
  "withdrawn",
  "superseded",
]);

export const evidenceStatusSchema = z.enum([
  "reported",
  "estimate",
  "projection",
  "awaiting_review",
]);

export const snapshotPlaceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  placeType: z.string().min(1),
  parentName: z.string().nullable(),
});

export const snapshotObservationSchema = z.object({
  observationId: z.string().min(1),
  placeId: z.string().min(1),
  indicatorId: z.string().min(1),
  indicatorCode: z.string().min(1),
  indicatorName: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  referenceYear: z.number().int().nullable(),
  referencePeriodStart: z.string().nullable(),
  referencePeriodEnd: z.string().nullable(),
  evidenceStatus: evidenceStatusSchema,
  methodologyVersion: z.string().nullable(),
  sourceReleaseId: z.string().nullable(),
  geographyType: z.string().min(1),
  calculationIds: z.array(z.string().min(1)),
});

const baseBlockSchema = z.object({
  id: z.string().min(1),
});

export const snapshotBlockSchema = z.discriminatedUnion("type", [
  baseBlockSchema.extend({
    type: z.literal("headline"),
    text: z.string().min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("narrative"),
    text: z.string().min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("metric"),
    observationId: z.string().min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("metric_group"),
    title: z.string().min(1),
    observationIds: z.array(z.string().min(1)).min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("difference"),
    originObservationId: z.string().min(1),
    targetObservationId: z.string().min(1),
    absoluteDifference: z.number().nonnegative(),
    unit: z.string().min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("ratio"),
    originObservationId: z.string().min(1),
    targetObservationId: z.string().min(1),
    ratio: z.number().nonnegative(),
  }),
  baseBlockSchema.extend({
    type: z.literal("rank"),
    placeId: z.string().min(1),
    rank: z.number().int().positive(),
    total: z.number().int().positive().nullable(),
  }),
  baseBlockSchema.extend({
    type: z.literal("trend"),
    placeId: z.string().min(1),
    indicatorCode: z.string().min(1),
    observationIds: z.array(z.string().min(1)).min(2),
  }),
  baseBlockSchema.extend({
    type: z.literal("map"),
    placeIds: z.array(z.string().min(1)).min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("table"),
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string())),
  }),
  baseBlockSchema.extend({
    type: z.literal("source_note"),
    sourceReleaseIds: z.array(z.string().min(1)).min(1),
    text: z.string().min(1),
  }),
  baseBlockSchema.extend({
    type: z.literal("methodology_note"),
    methodologyReferences: z.array(z.string().min(1)).min(1),
    text: z.string().min(1),
  }),
]);

export const snapshotManifestSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotType: snapshotTypeSchema,
  createdAt: z.string().datetime(),
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(500),
  places: z.array(snapshotPlaceSchema).min(1),
  blocks: z.array(snapshotBlockSchema).min(1),
  observations: z.array(snapshotObservationSchema).min(1),
  calculationReferences: z.array(z.string().min(1)),
  sourceReferences: z.array(z.string().min(1)),
  methodologyReferences: z.array(z.string().min(1)),
  presentation: z.object({
    contentMode: z.enum([
      "key_finding",
      "full_comparison",
      "data_table",
      "map_and_figures",
      "place_summary",
      "selected_indicators",
    ]),
    preferredVariant: z.enum(["landscape", "square", "portrait", "story"]),
    selectedIndicatorCodes: z.array(z.string().min(1)).min(1),
  }),
  alternativeText: z.string().min(1).max(1000),
  licenceContext: z.object({
    summary: z.string().min(1),
    sourceTermsRequired: z.boolean(),
  }),
});

export const createSnapshotRequestSchema = z.object({
  snapshotType: z.enum(["place_profile", "comparison"]),
  placeIds: z.array(z.string().min(1)).min(1).max(2),
  observationIds: z.array(z.string().min(1)).min(1).max(12),
  contentMode: z.enum([
    "key_finding",
    "full_comparison",
    "data_table",
    "map_and_figures",
    "place_summary",
    "selected_indicators",
  ]),
  preferredVariant: z
    .enum(["landscape", "square", "portrait", "story"])
    .default("landscape"),
});

export type SnapshotManifest = z.infer<typeof snapshotManifestSchema>;
export type SnapshotBlock = z.infer<typeof snapshotBlockSchema>;
export type SnapshotObservation = z.infer<typeof snapshotObservationSchema>;
export type SnapshotPlace = z.infer<typeof snapshotPlaceSchema>;
export type CreateSnapshotRequest = z.infer<typeof createSnapshotRequestSchema>;
export type SnapshotType = z.infer<typeof snapshotTypeSchema>;
export type SnapshotStatus = z.infer<typeof snapshotStatusSchema>;
