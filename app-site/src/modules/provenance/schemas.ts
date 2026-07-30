import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestampSchema = z.string().datetime({ offset: true });

export const publisherSchema = z.object({
  id: z.string().min(3),
  canonicalName: z.string().min(1),
  jurisdiction: z.string().min(1).nullable(),
  authorityGrade: z.enum([
    "official",
    "academic",
    "institutional",
    "commercial",
    "unknown",
  ]),
});

export const datasetReleaseSchema = z.object({
  id: z.string().min(3),
  datasetId: z.string().min(3),
  edition: z.string().min(1).nullable(),
  version: z.string().min(1).nullable(),
  releaseDate: dateSchema.nullable(),
  retrievedAt: timestampSchema.nullable(),
  contentHash: z.string().min(1).nullable(),
  archivedObjectKey: z.string().min(1).nullable(),
});
