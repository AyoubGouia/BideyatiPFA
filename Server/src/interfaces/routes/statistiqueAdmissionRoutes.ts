import { Router } from "express";
import { StatistiqueAdmissionController } from "../controllers/StatistiqueAdmissionController";

const router = Router();
const controller = new StatistiqueAdmissionController();

router.get("/statistiques-admission/search", controller.search);
router.get("/statistiques-admission/by-specialite/:specialiteId", controller.getBySpecialite);
router.get("/statistiques-admission/by-year-section/:year/:sectionId", controller.getByYearAndSection);
router.get("/statistiques-admission/by-year/:year", controller.getByYear);
router.get("/statistiques-admission", controller.getAll);

export default router;
