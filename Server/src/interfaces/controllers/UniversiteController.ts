import { Request, Response } from "express";
import { UniversiteService } from "../../application/services/UniversiteService";

export class UniversiteController {
  private service = new UniversiteService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getAll();
    res.status(200).json(data);
  };

  search = async (req: Request, res: Response): Promise<void> => {
    const q = req.query.q as string | undefined;
    const city = req.query.city as string | undefined;
    const region = req.query.region as string | undefined;
    const data = await this.service.search(q, city, region);
    res.status(200).json(data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const data = await this.service.getById(id);
    if (!data) {
      res.status(404).json({ message: "Université non trouvée" });
      return;
    }
    res.status(200).json(data);
  };
}
