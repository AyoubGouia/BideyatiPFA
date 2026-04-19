import { Router } from "express";
import { FavoriController } from "../controllers/FavoriController";
import { requireAuth } from "../middlewares/authenticateJWT";

const router = Router();
const controller = new FavoriController();

router.post("/favoris/toggle", requireAuth, controller.toggle);
router.get("/favoris", requireAuth, controller.getAll);
router.get("/favoris/check", requireAuth, controller.isFavorited);

export default router;
