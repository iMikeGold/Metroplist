import { z } from "zod";
import { PLACE_KINDS } from "./types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const placeSchema = z
  .object({
    id: z.string().min(3),
    slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    canonicalName: z.string().min(1),
    placeKind: z.enum(PLACE_KINDS),
    countryCode: z.string().length(2).nullable(),
    parentPlaceId: z.string().min(3).nullable(),
    status: z.enum(["current", "historical", "proposed", "disputed"]),
    validFrom: dateSchema.nullable(),
    validTo: dateSchema.nullable(),
  })
  .strict();

export const geographySchema = z
  .object({
    id: z.string().min(3),
    placeId: z.string().min(3),
    geographyType: z.string().min(1),
    administrativeLevel: z.string().min(1).nullable(),
    validFrom: dateSchema.nullable(),
    validTo: dateSchema.nullable(),
  })
  .strict();

export const boundaryVersionSchema = z
  .object({
    id: z.string().min(3),
    geographyId: z.string().min(3),
    referenceDate: dateSchema.nullable(),
    referenceYear: z.number().int().min(1).nullable(),
    landAreaKm2: z.number().nonnegative().nullable(),
    totalAreaKm2: z.number().nonnegative().nullable(),
    sourceReleaseId: z.string().min(3).nullable(),
    geometryObjectKey: z.string().min(1).nullable(),
  })
  .strict();
