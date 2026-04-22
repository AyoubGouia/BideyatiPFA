import { Request, Response } from "express";
import { RecommendationService } from "../../application/services/RecommendationService";
import { HttpError } from "../../application/utils/httpError";

export class RecommendationController {
  private service = new RecommendationService();

  getMetierRecommandations = async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const recommandations = await this.service.getMetierRecommandations(userId);
      return res.json(recommandations);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("[RecommendationController] Unexpected error:", error);
      return res.status(500).json({ error: "Failed to get recommendations" });
    }
  };
}
