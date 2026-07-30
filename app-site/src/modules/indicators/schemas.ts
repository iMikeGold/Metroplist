import { z } from "zod";
import { MEASUREMENT_TYPES } from "./types";

export const unitSchema = z
  .object({
    id: z.string().min(3),
    code: z.string().min(1),
    canonicalName: z.string().min(1),
    symbol: z.string().min(1).nullable(),
  })
  .strict();

export const indicatorSchema = z
  .object({
    id: z.string().min(3),
    code: z.string().min(1),
    canonicalName: z.string().min(1),
    domain: z.string().min(1),
    measurementType: z.enum(MEASUREMENT_TYPES),
    defaultUnitId: z.string().min(3),
    status: z.enum(["active", "planned", "retired"]),
    formulaCode: z.string().min(1).nullable(),
  })
  .strict();
