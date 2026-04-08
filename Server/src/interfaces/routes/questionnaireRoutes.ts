import { Router } from "express";
import { QuestionnaireController } from "../controllers/QuestionnaireController";
import { requireAuth } from "../middlewares/authenticateJWT";

const router = Router();
const controller = new QuestionnaireController();

router.post("/", requireAuth, controller.submitQuestionnaire);

export default router;

