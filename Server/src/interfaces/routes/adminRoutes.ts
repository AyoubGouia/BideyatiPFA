import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { requireAuth } from "../middlewares/authenticateJWT";
import { Request, Response, NextFunction } from "express";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.auth?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux administrateurs" });
    return;
  }
  next();
};

const router = Router();
const controller = new AdminController();

router.get("/stats", requireAuth, requireAdmin, controller.getStats);
router.get("/users", requireAuth, requireAdmin, controller.getUsers);
router.put("/users/:id/toggle", requireAuth, requireAdmin, controller.toggleUserActive);
router.delete("/users/:id", requireAuth, requireAdmin, controller.deleteUser);
router.get("/export", requireAuth, requireAdmin, controller.exportData);

export default router;
