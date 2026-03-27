import { prisma } from "../../infrastructure/config/prisma";

export class HomeService {
  async getHome() {
    const [universities, universitiesCount] = await Promise.all([
      prisma.universite.findMany({
        select: {
          id: true,
          nom: true,
          ville: true,
          region: true,
          description: true,
        },
        orderBy: { nom: "asc" },
      }),
      prisma.universite.count(),
    ]);

    return {
      platform: {
        name: "Bideyati",
        description: "University orientation platform for students in Algeria/Tunisia.",
      },
      statistics: {
        universitiesCount,
      },
      universities,
    };
  }
}

