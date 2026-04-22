import { Request, Response } from "express";
import { z } from "zod";
import { profileSettingsSchema } from "../validation/authSchemas";
import { ProfileService } from "../../application/services/ProfileService";
import { HttpError } from "../../application/utils/httpError";

const updateNotesSchema = z.object({
  notes: z.array(z.object({
    matiereNom: z.string().min(1),
    valeur: z.number().min(0).max(20),
  })),
  newMoyenneBac: z.number().min(0).max(20),
  newScore: z.number().min(0),
});

export class ProfileController {
  private profileService = new ProfileService();

  getProfile = async (req: Request, res: Response) => {
    try {
      console.log('[ProfileController] Getting profile for user:', req.auth?.userId);
      const userId = req.auth?.userId;
      if (!userId) {
        console.warn('[ProfileController] No userId found in request (Unauthorized)');
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const profile = await this.profileService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      console.error('[ProfileController] Failed to get profile:', error);
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      res.status(500).json({ error: "Failed to get profile" });
    }
  };

  updateNotes = async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const parsed = updateNotesSchema.parse(req.body);
      await this.profileService.updateNotes(
        userId,
        parsed.notes,
        parsed.newMoyenneBac,
        parsed.newScore,
      );
      res.status(200).json({ message: "Notes updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      console.error('[ProfileController] Failed to update notes:', error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  };

  updateSettings = async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const parsed = profileSettingsSchema.parse(req.body);
      await this.profileService.updateSettings(userId, parsed);
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      console.error('[ProfileController] Failed to update settings:', error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  };
}

