import { Router } from "express";
import authRoutes from "./authRoutes";
import homeRoutes from "./homeRoutes";
import profileRoutes from "./profileRoutes";
import questionnaireRoutes from "./questionnaireRoutes";
import universiteRoutes from "./universiteRoutes";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is healthy" });
});

router.use("/auth", authRoutes);
router.use(homeRoutes);
router.use(profileRoutes);
router.use(questionnaireRoutes);
router.use(universiteRoutes);

export default router;
