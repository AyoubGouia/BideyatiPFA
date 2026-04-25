import { prisma } from "../../infrastructure/config/prisma";
import { HttpError } from "../utils/httpError";

export class AdminService {
  async getStats() {
    const [totalUsers, totalStudents, totalAdmins, totalVisitors, totalUniversities, totalEstablishments, totalSpecialties] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "VISITOR" } }),
        prisma.universite.count(),
        prisma.etablissement.count(),
        prisma.specialite.count(),
      ]);

    return {
      totalUsers,
      totalStudents,
      totalAdmins,
      totalVisitors,
      totalUniversities,
      totalEstablishments,
      totalSpecialties,
    };
  }

  async getUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" as const } },
            { prenom: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateCreation: "desc" },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          actif: true,
          dateCreation: true,
          telephone: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) {
      throw new HttpError(400, "Vous ne pouvez pas désactiver votre propre compte");
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new HttpError(404, "Utilisateur introuvable");

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { actif: !user.actif },
      select: { id: true, actif: true },
    });

    return updated;
  }

  async deleteUser(targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) {
      throw new HttpError(400, "Vous ne pouvez pas supprimer votre propre compte");
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new HttpError(404, "Utilisateur introuvable");

    await prisma.user.delete({ where: { id: targetUserId } });
  }

  async exportData() {
    const [users, universities] = await Promise.all([
      prisma.user.findMany({
        orderBy: { dateCreation: "desc" },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          role: true,
          actif: true,
          dateCreation: true,
        },
      }),
      prisma.universite.findMany({
        orderBy: { nom: "asc" },
        select: { id: true, nom: true, ville: true, region: true, description: true },
      }),
    ]);

    return { exportDate: new Date().toISOString(), users, universities };
  }
}
