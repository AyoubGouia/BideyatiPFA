import { Router } from "express";
import { ProfileController } from "../controllers/ProfileController";
import { requireAuth } from "../middlewares/authenticateJWT";

const router = Router();
const controller = new ProfileController();

router.get("/", requireAuth, controller.getProfile);

export default router;

