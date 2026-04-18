import { Router } from "express";
import { AiSpecialityOverviewController } from "../controllers/AiSpecialityOverviewController";
import { requireAuth } from "../middlewares/authenticateJWT";

const router = Router();
const controller = new AiSpecialityOverviewController();

router.post(
  "/ai/speciality-overview",
  requireAuth,
  controller.getSpecialityOverview
);

export default router;

