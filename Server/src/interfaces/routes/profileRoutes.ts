import { Router } from "express";
import { ProfileController } from "../controllers/ProfileController";
import { requireAuth } from "../middlewares/authenticateJWT";

const router = Router();
const controller = new ProfileController();

router.get("/", requireAuth, controller.getProfile);
router.put("/notes", requireAuth, controller.updateNotes);
router.put("/settings", requireAuth, controller.updateSettings);

export default router;

