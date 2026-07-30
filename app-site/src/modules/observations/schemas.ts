import { z } from "zod";
import { PREFERRED_STATUSES, QUALITY_STATUSES } from "./types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestampSchema = z.string().datetime({ offset: true });

export const observationSchema = z
  .object({
    id: z.string().min(3),
    geographyId: z.string().min(3),
    boundaryVersionId: z.string().min(3).nullable(),
    indicatorId: z.string().min(3),
    unitId: z.string().min(3),
    datasetReleaseId: z.string().min(3).nullable(),
    valueNumeric: z.number().finite().nullable(),
    valueText: z.string().min(1).nullable(),
    referencePeriodStart: dateSchema.nullable(),
    referencePeriodEnd: dateSchema.nullable(),
    referenceYear: z.number().int().min(1).nullable(),
    publicationDate: dateSchema.nullable(),
    ingestedAt: timestampSchema,
    verifiedAt: timestampSchema.nullable(),
    qualityStatus: z.enum(QUALITY_STATUSES),
    preferredStatus: z.enum(PREFERRED_STATUSES),
    isEstimate: z.boolean(),
    methodologyVersion: z.string().min(1).nullable(),
  })
  .strict()
  .refine(
    (value) => value.valueNumeric !== null || value.valueText !== null,
    "An observation requires a numeric or textual value.",
  );
