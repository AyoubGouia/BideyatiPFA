import { Request, Response } from "express";
import { SpecialiteService } from "../../application/services/SpecialiteService";

export class SpecialiteController {
  private service = new SpecialiteService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string) : undefined;

      const data = await this.service.getAll(skip, take);
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des spécialités" });
    }
  };

  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query.q as string | undefined;
      const universiteId = req.query.universiteId as string | undefined;
      const etablissementId = req.query.etablissementId as string | undefined;
      const codeOrientation = req.query.codeOrientation as string | undefined;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string) : 20;

      const data = await this.service.search(
        q,
        universiteId,
        etablissementId,
        codeOrientation,
        skip,
        take
      );
      const total = await this.service.count(q, universiteId, etablissementId, codeOrientation);

      res.status(200).json({
        data,
        total,
        skip,
        take,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la recherche des spécialités" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.service.getById(id);

      if (!data) {
        res.status(404).json({ message: "Spécialité non trouvée" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération de la spécialité" });
    }
  };

  getByCodeOrientation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const data = await this.service.getByCodeOrientation(code);

      if (!data) {
        res.status(404).json({ message: "Spécialité non trouvée" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération de la spécialité" });
    }
  };
}
