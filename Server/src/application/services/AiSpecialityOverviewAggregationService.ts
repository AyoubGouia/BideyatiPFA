import { prisma } from "../../infrastructure/config/prisma";
import { HttpError } from "../utils/httpError";
import { CapaciteAdmissionService } from "./CapaciteAdmissionService";
import { StatistiqueAdmissionService } from "./StatistiqueAdmissionService";

type MissingDataKey =
  | "notes"
  | "questionnaire"
  | "historical_score"
  | "capacity";

type BuildOverviewParams = {
  userId: string;
  specialiteId: string;
  year?: number;
};

export type AiSpecialityOverviewPayload = {
  student: {
    userId: string;
    bacSection: {
      id: string;
      nom: string;
    };
    region: string | null;
    score: number | null;
    moyenneBac: number;
    notes: Array<{
      matiereId: string;
      matiereNom: string;
      valeur: number;
      annee: number | null;
    }>;
    questionnaire: {
      answers: Array<{
        question: string;
        reponse: string;
      }>;
    };
  };
  speciality: {
    id: string;
    codeOrientation: string;
    nom: string;
    domaine: string | null;
    etablissement: {
      id: string;
      nom: string;
      gouvernorat: string | null;
    } | null;
    universite: {
      id: string;
      nom: string;
      ville: string | null;
      region: string | null;
    } | null;
    scoreMinimum: number | null;
    formuleBrute: string | null;
  };
  historicalData: {
    yearUsed: number | null;
    lastAdmittedScore: {
      annee: number;
      sectionId: string;
      sectionNom: string;
      scoreDernierAdmis: number;
      scoreMinimum: number | null;
      tauxAdmission: number | null;
    } | null;
    capacities: Array<{
      annee: number;
      tour: string;
      sectionId: string;
      sectionNom: string;
      capacite: number;
    }>;
  };
  rules: {
    purpose: "guidance_only";
    prohibited: [
      "no_official_speciality_score_calculation",
      "no_admission_guarantee",
      "no_invented_missing_data",
    ];
    missingData: MissingDataKey[];
  };
};

export class AiSpecialityOverviewAggregationService {
  private statistiqueAdmissionService = new StatistiqueAdmissionService();
  private capaciteAdmissionService = new CapaciteAdmissionService();

  async buildOverview({
    userId,
    specialiteId,
    year,
  }: BuildOverviewParams): Promise<AiSpecialityOverviewPayload> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        section: {
          select: {
            id: true,
            nom: true,
          },
        },
        studentProfile: {
          select: {
            moyenneBac: true,
            score: true,
            region: true,
          },
        },
        notes: {
          select: {
            valeur: true,
            annee: true,
            matiere: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
          orderBy: [{ annee: "desc" }, { matiere: { nom: "asc" } }],
        },
        questionnaire: {
          include: {
            reponses: {
              orderBy: { id: "asc" },
            },
            profilAcademique: {
              select: {
                moyenneBac: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new HttpError(404, "Utilisateur introuvable");
    }

    if (!user.section) {
      throw new HttpError(409, "Votre profil doit inclure votre section du bac.");
    }
    const userSection = user.section;

    const moyenneBac =
      user.studentProfile?.moyenneBac ??
      user.questionnaire?.profilAcademique?.moyenneBac ??
      null;

    if (moyenneBac === null) {
      throw new HttpError(409, "Votre profil doit inclure votre moyenne au bac.");
    }

    const specialite = await prisma.specialite.findUnique({
      where: { id: specialiteId },
      select: {
        id: true,
        codeOrientation: true,
        nom: true,
        domaine: true,
        scoreMinimum: true,
        formuleBrute: true,
        etablissement: {
          select: {
            id: true,
            nom: true,
            gouvernorat: true,
            universite: {
              select: {
                id: true,
                nom: true,
                ville: true,
                region: true,
              },
            },
          },
        },
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

    if (!specialite) {
      throw new HttpError(404, "Specialite introuvable");
    }

    const missingData = new Set<MissingDataKey>();
    const yearUsed = await this.resolveYear({
      specialiteId,
      sectionId: userSection.id,
      requestedYear: year,
    });

    let lastAdmittedScore: AiSpecialityOverviewPayload["historicalData"]["lastAdmittedScore"] =
      null;
    let capacities: AiSpecialityOverviewPayload["historicalData"]["capacities"] = [];

    if (yearUsed !== null) {
      const [statsRows, capacityRows] = await Promise.all([
        this.statistiqueAdmissionService.search(
          specialiteId,
          yearUsed,
          userSection.id
        ),
        this.capaciteAdmissionService.search(
          specialiteId,
          yearUsed,
          userSection.id
        ),
      ]);

      if (statsRows.length > 0) {
        const stat = statsRows[0];
        lastAdmittedScore = {
          annee: stat.annee,
          sectionId: stat.sectionId ?? userSection.id,
          sectionNom: stat.section?.nom ?? userSection.nom,
          scoreDernierAdmis: stat.scoreDernierAdmis,
          scoreMinimum: stat.scoreMinimum ?? null,
          tauxAdmission: stat.tauxAdmission ?? null,
        };
      } else {
        missingData.add("historical_score");
      }

      if (capacityRows.length > 0) {
        capacities = capacityRows.map((row) => ({
          annee: row.annee,
          tour: row.tour,
          sectionId: row.sectionId ?? userSection.id,
          sectionNom: row.section?.nom ?? userSection.nom,
          capacite: row.capacite,
        }));
      } else {
        missingData.add("capacity");
      }
    } else {
      missingData.add("historical_score");
      missingData.add("capacity");
    }

    const notes = user.notes.map((note) => ({
      matiereId: note.matiere.id,
      matiereNom: note.matiere.nom,
      valeur: note.valeur,
      annee: note.annee ?? null,
    }));

    if (notes.length === 0) {
      missingData.add("notes");
    }

    const questionnaireAnswers =
      user.questionnaire?.reponses.map((reponse) => ({
        question: reponse.question,
        reponse: reponse.reponse,
      })) ?? [];

    if (questionnaireAnswers.length === 0) {
      missingData.add("questionnaire");
    }

    const universite =
      specialite.universite ?? specialite.etablissement?.universite ?? null;

    return {
      student: {
        userId: user.id,
        bacSection: {
          id: userSection.id,
          nom: userSection.nom,
        },
        region: user.studentProfile?.region ?? null,
        score: user.studentProfile?.score ?? null,
        moyenneBac,
        notes,
        questionnaire: {
          answers: questionnaireAnswers,
        },
      },
      speciality: {
        id: specialite.id,
        codeOrientation: specialite.codeOrientation,
        nom: specialite.nom,
        domaine: specialite.domaine ?? null,
        etablissement: specialite.etablissement
          ? {
              id: specialite.etablissement.id,
              nom: specialite.etablissement.nom,
              gouvernorat: specialite.etablissement.gouvernorat ?? null,
            }
          : null,
        universite: universite
          ? {
              id: universite.id,
              nom: universite.nom,
              ville: universite.ville ?? null,
              region: universite.region ?? null,
            }
          : null,
        scoreMinimum: specialite.scoreMinimum ?? null,
        formuleBrute: specialite.formuleBrute ?? null,
      },
      historicalData: {
        yearUsed,
        lastAdmittedScore,
        capacities,
      },
      rules: {
        purpose: "guidance_only",
        prohibited: [
          "no_official_speciality_score_calculation",
          "no_admission_guarantee",
          "no_invented_missing_data",
        ],
        missingData: Array.from(missingData),
      },
    };
  }

  private async resolveYear({
    specialiteId,
    sectionId,
    requestedYear,
  }: {
    specialiteId: string;
    sectionId: string;
    requestedYear?: number;
  }): Promise<number | null> {
    if (typeof requestedYear === "number") {
      return requestedYear;
    }

    const latestStat = await this.statistiqueAdmissionService.search(
      specialiteId,
      undefined,
      sectionId,
      0,
      1
    );
    if (latestStat.length > 0) {
      return latestStat[0].annee;
    }

    const latestCapacity = await this.capaciteAdmissionService.search(
      specialiteId,
      undefined,
      sectionId,
      undefined,
      0,
      1
    );
    if (latestCapacity.length > 0) {
      return latestCapacity[0].annee;
    }

    return null;
  }
}
