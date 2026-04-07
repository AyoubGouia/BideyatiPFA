import { Request, Response } from "express";
import { SectionService } from "../../application/services/SectionService";

export class SectionController {
  private service = new SectionService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.service.getAll();
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des sections" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.service.getById(id);

      if (!data) {
        res.status(404).json({ message: "Section non trouvée" });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération de la section" });
    }
  };
}
