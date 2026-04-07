import { Router } from "express";
import { SpecialiteController } from "../controllers/SpecialiteController";

const router = Router();
const controller = new SpecialiteController();

// Search must be before /:id to avoid 'search' being treated as an id
router.get("/specialites/search", controller.search);
router.get("/specialites/code/:code", controller.getByCodeOrientation);
router.get("/specialites/:id", controller.getById);
router.get("/specialites", controller.getAll);

export default router;
