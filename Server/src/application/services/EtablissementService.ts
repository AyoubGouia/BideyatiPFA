import { prisma } from "../../infrastructure/config/prisma";

export class EtablissementService {
  private normalizeSearchText(value?: string | null): string {
    return (value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private toListItem(etablissement: {
    id: string;
    code: number;
    nom: string;
    nomAr: string | null;
    gouvernorat: string | null;
    type: string | null;
    website: string | null;
    lat: number | null;
    lon: number | null;
    universiteId: string;
  }) {
    return {
      id: etablissement.id,
      code: etablissement.code,
      nom: etablissement.nom,
      nomAr: etablissement.nomAr,
      gouvernorat: etablissement.gouvernorat,
      type: etablissement.type,
      website: etablissement.website,
      lat: etablissement.lat,
      lon: etablissement.lon,
      universiteId: etablissement.universiteId,
    };
  }

  async getAll() {
    return prisma.etablissement.findMany({
      select: {
        id: true,
        code: true,
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
    const normalizedQuery = this.normalizeSearchText(q);
    const establishments = await prisma.etablissement.findMany({
      where: {
        AND: [
          gouvernorat ? { gouvernorat: { contains: gouvernorat, mode: "insensitive" } } : {},
          universiteId ? { universiteId } : {},
        ],
      },
      select: {
        id: true,
        code: true,
        nom: true,
        nomAr: true,
        gouvernorat: true,
        type: true,
        website: true,
        lat: true,
        lon: true,
        universiteId: true,
        universite: {
          select: {
            nom: true,
            nomAr: true,
            ville: true,
            region: true,
          },
        },
        specialites: {
          select: {
            nom: true,
            codeOrientation: true,
          },
        },
      },
      orderBy: { nom: "asc" },
    });

    if (!normalizedQuery) {
      return establishments.map((etablissement) => this.toListItem(etablissement));
    }

    return establishments
      .filter((etablissement) => {
        const haystacks = [
          etablissement.nom,
          etablissement.nomAr,
          etablissement.type,
          etablissement.gouvernorat,
          etablissement.universite?.nom,
          etablissement.universite?.nomAr,
          etablissement.universite?.ville,
          etablissement.universite?.region,
          ...etablissement.specialites.flatMap((specialite) => [
            specialite.nom,
            specialite.codeOrientation,
          ]),
        ];

        return haystacks.some((value) =>
          this.normalizeSearchText(value).includes(normalizedQuery)
        );
      })
      .map((etablissement) => this.toListItem(etablissement));
  }

  async getById(id: string) {
    return prisma.etablissement.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        nom: true,
        nomAr: true,
        website: true,
        gouvernorat: true,
        type: true,
        lat: true,
        lon: true,
        universiteId: true,
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
        specialites: {
          select: {
            id: true,
            codeOrientation: true,
            nom: true,
            domaine: true,
            scoreMinimum: true,
            formuleBrute: true,
          },
          orderBy: { nom: "asc" },
        },
      },
    });
  }
}
