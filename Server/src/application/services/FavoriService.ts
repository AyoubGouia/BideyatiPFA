import { prisma } from "../../infrastructure/config/prisma";
import { HttpError } from "../utils/httpError";

export class FavoriService {
  async toggleFavorite(userId: string, targetId: string, type: "etablissement" | "specialite") {
    const where: any = { userId };
    const data: any = { userId };

    if (type === "etablissement") {
      where.etablissementId = targetId;
      data.etablissementId = targetId;
    } else {
      where.specialiteId = targetId;
      data.specialiteId = targetId;
    }

    const existing = await prisma.favori.findUnique({
      where: {
        userId_specialiteId: type === "specialite" ? { userId, specialiteId: targetId } : undefined,
        userId_etablissementId: type === "etablissement" ? { userId, etablissementId: targetId } : undefined,
      } as any
    });

    if (existing) {
      await prisma.favori.delete({ where: { id: existing.id } });
      return { favorited: false };
    } else {
      await prisma.favori.create({ data });
      return { favorited: true };
    }
  }

  async getFavorites(userId: string) {
    return prisma.favori.findMany({
      where: { userId },
      include: {
        etablissement: {
          include: {
            universite: true,
            specialites: true,
          }
        },
        specialite: {
          include: {
            etablissement: true,
            universite: true,
          }
        }
      },
      orderBy: { dateAjout: "desc" }
    });
  }

  async isFavorited(userId: string, targetId: string, type: "etablissement" | "specialite") {
     const existing = await prisma.favori.findUnique({
      where: {
        userId_specialiteId: type === "specialite" ? { userId, specialiteId: targetId } : undefined,
        userId_etablissementId: type === "etablissement" ? { userId, etablissementId: targetId } : undefined,
      } as any
    });
    return !!existing;
  }
}
