import { prisma } from "../../infrastructure/config/prisma";

export class EtablissementService {
  async getAll() {
    return prisma.etablissement.findMany({
      select: {
        id: true,
        nom: true,
        nomAr: true,
        gouvernorat: true,
        type: true,
        website: true,
        lat: true,
        lon: true,
        universiteId: true,
      },
      orderBy: { nom: "asc" },
    });
  }

  async search(q?: string, gouvernorat?: string, universiteId?: string) {
    return prisma.etablissement.findMany({
      where: {
        AND: [
          q ? { nom: { contains: q, mode: "insensitive" } } : {},
          gouvernorat ? { gouvernorat: { contains: gouvernorat, mode: "insensitive" } } : {},
          universiteId ? { universiteId } : {},
        ],
      },
      select: {
        id: true,
        nom: true,
        nomAr: true,
        gouvernorat: true,
        type: true,
        website: true,
        lat: true,
        lon: true,
        universiteId: true,
      },
      orderBy: { nom: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.etablissement.findUnique({
      where: { id },
      include: {
        universite: {
          select: {
            id: true,
            nom: true,
            ville: true,
            region: true,
          },
        },
      },
    });
  }
}
