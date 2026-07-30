import { z } from "zod";
import { CLAIM_TYPES } from "./types";

export const knowledgeClaimSchema = z
  .object({
    id: z.string().min(3),
    knowledgeVersionId: z.string().min(3),
    claimText: z.string().min(1),
    claimType: z.enum(CLAIM_TYPES),
    verificationStatus: z.enum([
      "unverified",
      "under_review",
      "verified",
      "qualified",
      "rejected",
    ]),
  })
  .strict();
