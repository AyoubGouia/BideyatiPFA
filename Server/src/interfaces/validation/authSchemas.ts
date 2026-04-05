import { z } from "zod";

const toFloat = (v: unknown) => {
  if (typeof v === "string") return Number.parseFloat(v);
  return v;
};

export const registerSchema = z.object({
  nom: z.string().min(1, "nom is required"),
  prenom: z.string().min(1, "prenom is required"),
  email: z.string().email("email must be valid"),
  telephone: z.string().min(1, "telephone is required"),
  motDePasse: z.string().min(6, "motDePasse must be at least 6 characters"),
  numeroBAC: z.string().min(1, "numeroBAC is required"),
  moyenneBac: z.preprocess(toFloat, z.number().finite().nonnegative()),
  section: z.string().min(1, "section is required"),
});

export const loginSchema = z.object({
  email: z.string().email("email must be valid"),
  motDePasse: z.string().min(1, "motDePasse is required"),
});

