import { Request, Response } from "express";
import { AdminService } from "../../application/services/AdminService";
import { HttpError } from "../../application/utils/httpError";

export class AdminController {
  private adminService = new AdminService();

  getStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.adminService.getStats();
      res.status(200).json(stats);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("[AdminController] getStats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  };

  getUsers = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string) || undefined;
      const result = await this.adminService.getUsers(page, limit, search);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("[AdminController] getUsers error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  };

  toggleUserActive = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.auth!.userId;
      const updated = await this.adminService.toggleUserActive(id, requestingUserId);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("[AdminController] toggleUserActive error:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  };

  createUniversity = async (req: Request, res: Response) => {
    try {
      const { nom, ville, region, description, siteweb, adresse, nomAr } = req.body;
      if (!nom?.trim() || !ville?.trim() || !region?.trim()) {
        res.status(400).json({ error: "Nom, ville et région sont requis" });
        return;
      }
      const university = await this.adminService.createUniversity({ nom: nom.trim(), ville: ville.trim(), region: region.trim(), description, siteweb, adresse, nomAr });
      res.status(201).json(university);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("[AdminController] createUniversity error:", error);
      res.status(500).json({ error: "Failed to create university" });
    }
  };

  deleteUniversity = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.adminService.deleteUniversity(id);
      res.status(200).json({ message: "Université supprimée" });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("[AdminController] deleteUniversity error:", error);
      res.status(500).json({ error: "Failed to delete university" });
    }
  };

  exportData = async (req: Request, res: Response) => {
    try {
      const data = await this.adminService.exportData();
      const json = JSON.stringify(data, null, 2);
      const bytes = Buffer.byteLength(json, "utf8");
      const filename = `bideyati-backup-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", bytes);
      res.status(200).send(json);
    } catch (error) {
      console.error("[AdminController] exportData error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.auth!.userId;
      await this.adminService.deleteUser(id, requestingUserId);
      res.status(200).json({ message: "Utilisateur supprimé" });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("[AdminController] deleteUser error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  };
}
