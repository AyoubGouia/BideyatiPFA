import { prisma } from "../../infrastructure/config/prisma";

export class CapaciteAdmissionService {
  async getAll(skip?: number, take?: number) {
    return prisma.capaciteAdmission.findMany({
      select: {
        id: true,
        annee: true,
        tour: true,
        capacite: true,
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
      orderBy: [{ annee: "desc" }, { tour: "asc" }, { specialiteId: "asc" }],
      skip,
      take,
    });
  }

  async search(
    specialiteId?: string,
    year?: number,
    sectionId?: string,
    tour?: string,
    skip?: number,
    take?: number
  ) {
    return prisma.capaciteAdmission.findMany({
      where: {
        AND: [
          specialiteId ? { specialiteId } : {},
          year ? { annee: year } : {},
          sectionId ? { sectionId } : {},
          tour ? { tour } : {},
        ],
      },
      select: {
        id: true,
        annee: true,
        tour: true,
        capacite: true,
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
      orderBy: [{ annee: "desc" }, { tour: "asc" }, { section: { nom: "asc" } }],
      skip,
      take,
    });
  }

  async getBySpecialite(specialiteId: string) {
    return prisma.capaciteAdmission.findMany({
      where: { specialiteId },
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
      orderBy: [{ annee: "desc" }, { tour: "asc" }, { section: { nom: "asc" } }],
    });
  }

  async getByYear(year: number) {
    return prisma.capaciteAdmission.findMany({
      where: { annee: year },
      select: {
        id: true,
        tour: true,
        capacite: true,
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
      orderBy: [{ tour: "asc" }, { specialiteId: "asc" }, { section: { nom: "asc" } }],
    });
  }

  async getByYearAndSection(year: number, sectionId: string) {
    return prisma.capaciteAdmission.findMany({
      where: {
        annee: year,
        sectionId,
      },
      select: {
        id: true,
        tour: true,
        capacite: true,
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
      orderBy: [{ tour: "asc" }, { capacite: "desc" }],
    });
  }

  async getToursByYear(year: number) {
    const tours = await prisma.capaciteAdmission.findMany({
      where: { annee: year },
      select: { tour: true },
      distinct: ["tour"],
      orderBy: { tour: "asc" },
    });
    return tours.map((t) => t.tour);
  }

  async count(specialiteId?: string, year?: number, sectionId?: string, tour?: string) {
    return prisma.capaciteAdmission.count({
      where: {
        AND: [
          specialiteId ? { specialiteId } : {},
          year ? { annee: year } : {},
          sectionId ? { sectionId } : {},
          tour ? { tour } : {},
        ],
      },
    });
  }
}
