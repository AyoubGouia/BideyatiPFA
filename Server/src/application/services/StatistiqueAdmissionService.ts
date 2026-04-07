import { prisma } from "../../infrastructure/config/prisma";

export class StatistiqueAdmissionService {
  async getAll(skip?: number, take?: number) {
    return prisma.statistiqueAdmission.findMany({
      select: {
        id: true,
        annee: true,
        scoreDernierAdmis: true,
        scoreMinimum: true,
        tauxAdmission: true,
        specialiteId: true,
        sectionId: true,
        specialite: {
          select: {
            id: true,
            codeOrientation: true,
            nom: true,
          },
        },
        section: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [{ annee: "desc" }, { specialiteId: "asc" }],
      skip,
      take,
    });
  }

  async search(
    specialiteId?: string,
    year?: number,
    sectionId?: string,
    skip?: number,
    take?: number
  ) {
    return prisma.statistiqueAdmission.findMany({
      where: {
        AND: [
          specialiteId ? { specialiteId } : {},
          year ? { annee: year } : {},
          sectionId ? { sectionId } : {},
        ],
      },
      select: {
        id: true,
        annee: true,
        scoreDernierAdmis: true,
        scoreMinimum: true,
        tauxAdmission: true,
        specialiteId: true,
        sectionId: true,
        specialite: {
          select: {
            id: true,
            codeOrientation: true,
            nom: true,
          },
        },
        section: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [{ annee: "desc" }, { section: { nom: "asc" } }],
      skip,
      take,
    });
  }

  async getBySpecialite(specialiteId: string) {
    return prisma.statistiqueAdmission.findMany({
      where: { specialiteId },
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
    });
  }

  async getByYear(year: number) {
    return prisma.statistiqueAdmission.findMany({
      where: { annee: year },
      select: {
        id: true,
        scoreDernierAdmis: true,
        scoreMinimum: true,
        tauxAdmission: true,
        specialiteId: true,
        sectionId: true,
        specialite: {
          select: {
            id: true,
            codeOrientation: true,
            nom: true,
            etablissement: {
              select: {
                nom: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [{ specialiteId: "asc" }, { section: { nom: "asc" } }],
    });
  }

  async getByYearAndSection(year: number, sectionId: string) {
    return prisma.statistiqueAdmission.findMany({
      where: {
        annee: year,
        sectionId,
      },
      select: {
        id: true,
        scoreDernierAdmis: true,
        scoreMinimum: true,
        tauxAdmission: true,
        specialiteId: true,
        specialite: {
          select: {
            id: true,
            codeOrientation: true,
            nom: true,
            etablissement: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
      orderBy: { scoreDernierAdmis: "desc" },
    });
  }

  async count(specialiteId?: string, year?: number, sectionId?: string) {
    return prisma.statistiqueAdmission.count({
      where: {
        AND: [
          specialiteId ? { specialiteId } : {},
          year ? { annee: year } : {},
          sectionId ? { sectionId } : {},
        ],
      },
    });
  }
}
