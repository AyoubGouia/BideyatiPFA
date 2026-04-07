import { Router } from "express";
import { SectionController } from "../controllers/SectionController";

const router = Router();
const controller = new SectionController();

router.get("/sections/:id", controller.getById);
router.get("/sections", controller.getAll);

export default router;
