import { Router } from "express";
import { EtablissementController } from "../controllers/EtablissementController";

const router = Router();
const controller = new EtablissementController();

// /search must be before /:id to avoid 'search' being treated as an id
router.get("/etablissements/search", controller.search);
router.get("/etablissements/:id", controller.getById);
router.get("/etablissements", controller.getAll);

export default router;
