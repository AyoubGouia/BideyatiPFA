import { Router } from "express";
import { CapaciteAdmissionController } from "../controllers/CapaciteAdmissionController";

const router = Router();
const controller = new CapaciteAdmissionController();

router.get("/capacites-admission/search", controller.search);
router.get("/capacites-admission/by-specialite/:specialiteId", controller.getBySpecialite);
router.get("/capacites-admission/by-year-section/:year/:sectionId", controller.getByYearAndSection);
router.get("/capacites-admission/tours/:year", controller.getToursByYear);
router.get("/capacites-admission/by-year/:year", controller.getByYear);
router.get("/capacites-admission", controller.getAll);

export default router;
