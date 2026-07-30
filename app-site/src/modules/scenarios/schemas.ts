import { z } from "zod";
import { SCENARIO_STATUSES } from "./types";

export const scenarioSchema = z
  .object({
    id: z.string().min(3),
    code: z.string().min(1),
    canonicalTitle: z.string().min(1),
    description: z.string().min(1),
    scenarioType: z.string().min(1),
    referenceYear: z.number().int().min(1).nullable(),
    sourceId: z.string().min(3).nullable(),
    status: z.enum(SCENARIO_STATUSES),
  })
  .strict();

export const scenarioInputSchema = z
  .object({
    key: z.string().min(1),
    valueNumeric: z.number().finite().nullable(),
    valueText: z.string().min(1).nullable(),
    unitId: z.string().min(3).nullable(),
    referenceYear: z.number().int().min(1).nullable(),
    provenanceStatus: z.enum([
      "source_asserted_unverified",
      "linked_canonical_observation",
      "verified_derivation",
    ]),
  })
  .strict()
  .refine(
    (value) => value.valueNumeric !== null || value.valueText !== null,
    "A scenario input requires a numeric or textual value.",
  );
