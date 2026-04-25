import { Router } from "express";
import authRoutes from "./authRoutes";
import homeRoutes from "./homeRoutes";
import profileRoutes from "./profileRoutes";
import questionnaireRoutes from "./questionnaireRoutes";
import universiteRoutes from "./universiteRoutes";
import etablissementRoutes from "./etablissementRoutes";
import specialiteRoutes from "./specialiteRoutes";
import statistiqueAdmissionRoutes from "./statistiqueAdmissionRoutes";
import capaciteAdmissionRoutes from "./capaciteAdmissionRoutes";
import sectionRoutes from "./sectionRoutes";
import aiRoutes from "./aiRoutes";
import favoriRoutes from "./favoriRoutes";
import recommandationRoutes from "./recommandationRoutes";
import adminRoutes from "./adminRoutes";


const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is healthy" });
});

router.use("/auth", authRoutes);
router.use(homeRoutes);
router.use("/profile", profileRoutes);
router.use("/questionnaire", questionnaireRoutes);
router.use(universiteRoutes);
router.use(etablissementRoutes);
router.use(specialiteRoutes);
router.use(statistiqueAdmissionRoutes);
router.use(capaciteAdmissionRoutes);
router.use(sectionRoutes);
router.use(aiRoutes);
router.use(favoriRoutes);
router.use("/recommandations", recommandationRoutes);
router.use("/admin", adminRoutes);


export default router;
