import { Request, Response } from "express";
import { StatistiqueAdmissionService } from "../../application/services/StatistiqueAdmissionService";

export class StatistiqueAdmissionController {
  private service = new StatistiqueAdmissionService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string) : undefined;

      const data = await this.service.getAll(skip, take);
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  };

  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const specialiteId = req.query.specialiteId as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const sectionId = req.query.sectionId as string | undefined;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string) : 50;

      const data = await this.service.search(specialiteId, year, sectionId, skip, take);
      const total = await this.service.count(specialiteId, year, sectionId);

      res.status(200).json({
        data,
        total,
        skip,
        take,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la recherche des statistiques" });
    }
  };

  getBySpecialite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specialiteId } = req.params;
      const data = await this.service.getBySpecialite(specialiteId);

      if (!data || data.length === 0) {
        res.status(404).json({ message: "Aucun score trouvé pour cette spécialité" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des scores" });
    }
  };

  getByYear = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = parseInt(req.params.year as string);

      if (isNaN(year)) {
        res.status(400).json({ message: "L'année doit être un nombre valide" });
        return;
      }

      const data = await this.service.getByYear(year);

      if (!data || data.length === 0) {
        res.status(404).json({ message: "Aucun score trouvé pour cette année" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des scores" });
    }
  };

  getByYearAndSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = parseInt(req.params.year as string);
      const { sectionId } = req.params;

      if (isNaN(year)) {
        res.status(400).json({ message: "L'année doit être un nombre valide" });
        return;
      }

      const data = await this.service.getByYearAndSection(year, sectionId);

      if (!data || data.length === 0) {
        res.status(404).json({ message: "Aucun score trouvé pour cette année et section" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des scores" });
    }
  };
}
