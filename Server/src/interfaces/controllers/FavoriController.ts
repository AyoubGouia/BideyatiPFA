import { Request, Response } from "express";
import { FavoriService } from "../../application/services/FavoriService";

export class FavoriController {
  private service = new FavoriService();

  toggle = async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }

    const { targetId, type } = req.body;
    if (!targetId || !["etablissement", "specialite"].includes(type)) {
      res.status(400).json({ message: "targetId et type ('etablissement' or 'specialite') sont requis" });
      return;
    }

    const result = await this.service.toggleFavorite(userId, targetId, type);
    res.status(200).json(result);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }

    const favorites = await this.service.getFavorites(userId);
    res.status(200).json(favorites);
  };

  isFavorited = async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth?.userId;
    const { targetId, type } = req.query;
    
    if (!userId || !targetId || !type) {
      res.status(200).json({ favorited: false });
      return;
    }

    const favorited = await this.service.isFavorited(userId, targetId as string, type as any);
    res.status(200).json({ favorited });
  };
}
