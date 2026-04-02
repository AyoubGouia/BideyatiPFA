import { prisma } from "../../infrastructure/config/prisma";

export class UniversiteService {
  async getAll() {
    return prisma.universite.findMany({
      select: {
        id: true,
        nom: true,
        nomAr: true,
        ville: true,
        region: true,
        siteweb: true,
        description: true,
      },
      orderBy: { nom: "asc" },
    });
  }

  async search(q?: string, city?: string, region?: string) {
    return prisma.universite.findMany({
      where: {
        AND: [
          q
            ? { nom: { contains: q, mode: "insensitive" } }
            : {},
          city
            ? { ville: { contains: city, mode: "insensitive" } }
            : {},
          region
            ? { region: { contains: region, mode: "insensitive" } }
            : {},
        ],
      },
      select: {
        id: true,
        nom: true,
        nomAr: true,
        ville: true,
        region: true,
        siteweb: true,
        description: true,
      },
      orderBy: { nom: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.universite.findUnique({
      where: { id },
      include: {
        etablissements: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            gouvernorat: true,
            type: true,
            website: true,
            lat: true,
            lon: true,
          },
          orderBy: { nom: "asc" },
        },
      },
    });
  }
}
