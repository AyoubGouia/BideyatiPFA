import { z } from "zod";

const toInt = (v: unknown) => {
  if (typeof v === "string") return Number.parseInt(v, 10);
  return v;
};

export const specialityOverviewSchema = z.object({
  specialiteId: z.string().trim().min(1, "specialiteId is required"),
  year: z
    .preprocess(toInt, z.number().int().min(1900).max(9999))
    .optional(),
});

const nonEmptyStringSchema = z.string().trim().min(1);

export const specialityOverviewAnalysisSchema = z.object({
  label: z.enum(["safe", "balanced", "ambitious", "risky"]),
  confidence: z.enum(["low", "medium", "high"]),
  summary: nonEmptyStringSchema,
  strengths: z.array(nonEmptyStringSchema),
  risks: z.array(nonEmptyStringSchema),
  advice: z.array(nonEmptyStringSchema),
  disclaimer: nonEmptyStringSchema,
});

export const specialityOverviewResponseSchema = z.object({
  specialiteId: z.string().trim().min(1),
  yearRequested: z.number().int().min(1900).max(9999).nullable(),
  yearUsed: z.number().int().min(1900).max(9999).nullable(),
  completeness: z.object({
    hasSection: z.boolean(),
    hasMoyenne: z.boolean(),
    hasNotes: z.boolean(),
    hasQuestionnaire: z.boolean(),
    hasHistoricalScore: z.boolean(),
    hasCapacity: z.boolean(),
  }),
  analysis: specialityOverviewAnalysisSchema,
});

export type SpecialityOverviewAnalysis = z.infer<
  typeof specialityOverviewAnalysisSchema
>;
export type SpecialityOverviewResponse = z.infer<
  typeof specialityOverviewResponseSchema
>;
