import { prisma } from "../../infrastructure/config/prisma";

export class SectionService {
  async getAll() {
    return prisma.section.findMany({
      select: {
        id: true,
        nom: true,
      },
      orderBy: { nom: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.section.findUnique({
      where: { id },
      include: {
        statistiquesAdmissions: {
          select: {
            id: true,
            annee: true,
            scoreDernierAdmis: true,
            specialite: {
              select: {
                nom: true,
                codeOrientation: true,
              },
            },
          },
          orderBy: { annee: "desc" },
          take: 10,
        },
      },
    });
  }
}
