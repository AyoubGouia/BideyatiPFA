import { Response, Request } from "express";
import { HomeService } from "../../application/services/HomeService";

export class HomeController {
  private homeService = new HomeService();

  getHome = async (req: Request, res: Response) => {
    const data = await this.homeService.getHome();
    res.status(200).json(data);
  };
}

