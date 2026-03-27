import { Router } from "express";
import { HomeController } from "../controllers/HomeController";

const router = Router();
const controller = new HomeController();

router.get("/home", controller.getHome);

export default router;

