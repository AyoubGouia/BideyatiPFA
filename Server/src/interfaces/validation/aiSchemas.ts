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

const headlineSchema = nonEmptyStringSchema.max(80);
const summarySchema = nonEmptyStringSchema.max(320);
const pointSchema = nonEmptyStringSchema.max(140);
const adviceSchema = nonEmptyStringSchema.max(140);
const disclaimerSchema = nonEmptyStringSchema.max(180);

export const specialityOverviewAnalysisSchema = z
  .object({
    label: z.enum(["safe", "balanced", "ambitious", "risky"]),
    confidence: z.enum(["low", "medium", "high"]),
    headline: headlineSchema,
    summary: summarySchema,
    keyPoints: z.array(pointSchema).min(2).max(4),
    advice: z.array(adviceSchema).min(1).max(3),
    disclaimer: disclaimerSchema,
  })
  .strict();

export const specialityOverviewResponseSchema = z
  .object({
    specialiteId: z.string().trim().min(1),
    yearRequested: z.number().int().min(1900).max(9999).nullable(),
    yearUsed: z.number().int().min(1900).max(9999).nullable(),
    analysis: specialityOverviewAnalysisSchema,
  })
  .strict();

export type SpecialityOverviewAnalysis = z.infer<
  typeof specialityOverviewAnalysisSchema
>;
export type SpecialityOverviewResponse = z.infer<
  typeof specialityOverviewResponseSchema
>;
