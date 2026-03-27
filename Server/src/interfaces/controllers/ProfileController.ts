import { Request, Response } from "express";
import { ProfileService } from "../../application/services/ProfileService";
import { HttpError } from "../../application/utils/httpError";

export class ProfileController {
  private profileService = new ProfileService();

  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const profile = await this.profileService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      res.status(500).json({ error: "Failed to get profile" });
    }
  };
}

