import { Request, Response } from "express";
import { ProfileService } from "../../application/services/ProfileService";
import { HttpError } from "../../application/utils/httpError";

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
}

