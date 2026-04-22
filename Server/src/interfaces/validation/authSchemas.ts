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
  numeroBAC: z.string().regex(/^\d{6}$/, "Le numéro de Bac doit être composé de 6 chiffres exactement"),
  dateNaissance: z.string().refine((dateStr) => {
    const dob = new Date(dateStr);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return age >= 17 && age <= 90;
  }, "Vous devez avoir entre 17 et 90 ans pour vous inscrire"),
  moyenneBac: z.preprocess(toFloat, z.number().finite().nonnegative()),
  score: z.preprocess(toFloat, z.number().finite().nonnegative().optional()),
  region: z.string().optional(),
  section: z.string().min(1, "section is required"),
});

export const loginSchema = z.object({
  email: z.string().email("email must be valid"),
  motDePasse: z.string().min(1, "motDePasse is required"),
});

export const profileSettingsSchema = z.object({
  nom: z.string().min(1, "nom is required").optional(),
  prenom: z.string().min(1, "prenom is required").optional(),
  email: z.string().email("email must be valid").optional(),
  motDePasse: z.string().min(6, "motDePasse must be at least 6 characters").optional().or(z.literal('')),
  numeroBAC: z.string().regex(/^\d{6}$/, "Le numéro de Bac doit être composé de 6 chiffres exactement").optional(),
  dateNaissance: z.string().refine((dateStr) => {
    if (!dateStr) return true;
    const dob = new Date(dateStr);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return age >= 17 && age <= 90;
  }, "Vous devez avoir entre 17 et 90 ans").optional(),
});

