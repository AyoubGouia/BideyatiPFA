import { Router } from "express";
import { UniversiteController } from "../controllers/UniversiteController";

const router = Router();
const controller = new UniversiteController();

router.get("/universites/search", controller.search);
router.get("/universites/:id", controller.getById);
router.get("/universites", controller.getAll);

export default router;
