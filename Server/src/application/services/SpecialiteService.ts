import { prisma } from "../../infrastructure/config/prisma";

export class SpecialiteService {
  async getAll(skip?: number, take?: number) {
    return prisma.specialite.findMany({
      select: {
        id: true,
        codeOrientation: true,
        nom: true,
        domaine: true,
        scoreMinimum: true,
        etablissement: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            gouvernorat: true,
          },
        },
        universite: {
          select: {
            id: true,
            nom: true,
            ville: true,
          },
        },
      },
      orderBy: { nom: "asc" },
      skip,
      take,
    });
  }

  async search(
    q?: string,
    universiteId?: string,
    etablissementId?: string,
    codeOrientation?: string,
    skip?: number,
    take?: number
  ) {
    return prisma.specialite.findMany({
      where: {
        AND: [
          q ? { nom: { contains: q, mode: "insensitive" } } : {},
          universiteId ? { universiteId } : {},
          etablissementId ? { etablissementId } : {},
          codeOrientation ? { codeOrientation } : {},
        ],
      },
      select: {
        id: true,
        codeOrientation: true,
        nom: true,
        domaine: true,
        scoreMinimum: true,
        etablissement: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            gouvernorat: true,
          },
        },
        universite: {
          select: {
            id: true,
            nom: true,
            ville: true,
          },
        },
      },
      orderBy: { nom: "asc" },
      skip,
      take,
    });
  }

  async getById(id: string) {
    return prisma.specialite.findUnique({
      where: { id },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            gouvernorat: true,
            type: true,
            website: true,
            lat: true,
            lon: true,
            universite: {
              select: {
                id: true,
                nom: true,
                nomAr: true,
                ville: true,
                region: true,
                siteweb: true,
                adresse: true,
              },
            },
          },
        },
        universite: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            ville: true,
            region: true,
            siteweb: true,
          },
        },
        statistiquesAdmissions: {
          select: {
            id: true,
            annee: true,
            scoreDernierAdmis: true,
            scoreMinimum: true,
            tauxAdmission: true,
            section: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
          orderBy: [{ annee: "desc" }, { section: { nom: "asc" } }],
        },
        capacitesAdmissions: {
          select: {
            id: true,
            annee: true,
            tour: true,
            capacite: true,
            section: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
          where: { annee: 2025 },
          orderBy: [{ tour: "asc" }, { section: { nom: "asc" } }],
        },
      },
    });
  }

  async getByCodeOrientation(code: string) {
    return prisma.specialite.findUnique({
      where: { codeOrientation: code },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            gouvernorat: true,
            type: true,
            website: true,
          },
        },
        universite: {
          select: {
            id: true,
            nom: true,
            nomAr: true,
            ville: true,
          },
        },
      },
    });
  }

  async count(
    q?: string,
    universiteId?: string,
    etablissementId?: string,
    codeOrientation?: string
  ) {
    return prisma.specialite.count({
      where: {
        AND: [
          q ? { nom: { contains: q, mode: "insensitive" } } : {},
          universiteId ? { universiteId } : {},
          etablissementId ? { etablissementId } : {},
          codeOrientation ? { codeOrientation } : {},
        ],
      },
    });
  }
}
