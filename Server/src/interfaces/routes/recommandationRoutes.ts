import { Router } from "express";
import { RecommendationController } from "../controllers/RecommendationController";
import { requireAuth } from "../middlewares/authenticateJWT";

const router = Router();
const controller = new RecommendationController();

router.get("/metiers", requireAuth, controller.getMetierRecommandations);

export default router;
