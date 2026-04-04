import { Request, Response } from "express";
import { EtablissementService } from "../../application/services/EtablissementService";

export class EtablissementController {
  private service = new EtablissementService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getAll();
    res.status(200).json(data);
  };

  search = async (req: Request, res: Response): Promise<void> => {
    const q = req.query.q as string | undefined;
    const gouvernorat = req.query.gouvernorat as string | undefined;
    const universiteId = req.query.universiteId as string | undefined;
    const data = await this.service.search(q, gouvernorat, universiteId);
    res.status(200).json(data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const data = await this.service.getById(id);
    if (!data) {
      res.status(404).json({ message: "Établissement non trouvé" });
      return;
    }
    res.status(200).json(data);
  };
}
