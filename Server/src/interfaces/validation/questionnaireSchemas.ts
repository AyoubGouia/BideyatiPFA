import { z } from "zod";

const toFloat = (v: unknown) => {
  if (typeof v === "string") return Number.parseFloat(v);
  return v;
};

const toInt = (v: unknown) => {
  if (typeof v === "string") return Number.parseInt(v, 10);
  return v;
};

export const submitQuestionnaireSchema = z.object({
  reponses: z
    .array(
      z.object({
        question: z.string().min(1, "question is required"),
        reponse: z.string().min(1, "reponse is required"),
      })
    )
    .min(1, "reponses must contain at least one answer"),
  notes: z
    .array(
      z.object({
        matiereNom: z.string().min(1, "matiereNom is required"),
        annee: z.preprocess(toInt, z.number().int().min(1900).max(2100)),
        valeur: z.preprocess(toFloat, z.number().finite().nonnegative()),
      })
    )
    .min(1, "notes must contain at least one grade entry"),
});

