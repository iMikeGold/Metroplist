import { z } from "zod";
import { DATA_REQUEST_STATUSES } from "./types";

export const dataRequestSchema = z
  .object({
    id: z.string().min(3),
    requestedPlaceAText: z.string().min(1).nullable(),
    requestedPlaceBText: z.string().min(1).nullable(),
    resolvedPlaceAId: z.string().min(3).nullable(),
    resolvedPlaceBId: z.string().min(3).nullable(),
    requestedIndicatorText: z.string().min(1).nullable(),
    resolvedIndicatorId: z.string().min(3).nullable(),
    status: z.enum(DATA_REQUEST_STATUSES),
    requestCount: z.number().int().positive(),
  })
  .strict();
