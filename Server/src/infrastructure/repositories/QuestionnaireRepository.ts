import { IQuestionnaireRepository, SaveQuestionnaireParams } from "../../domain/repositories/IQuestionnaireRepository";
import { prisma } from "../config/prisma";

export class QuestionnaireRepository implements IQuestionnaireRepository {
  async saveQuestionnaireAndNotes(data: SaveQuestionnaireParams) {
    return prisma.$transaction(async (tx) => {
      const questionnaire = await tx.questionnaire.create({
        data: {
          userId: data.userId,
          dateSoumission: new Date(),
          reponses: {
            create: data.reponses.map((r) => ({
              question: r.question,
              reponse: r.reponse,
            })),
          },
          profilAcademique: {
            create: {
              moyenneBac: data.moyenneBac,
              scorePondere: data.scorePondere,
            },
          },
        },
      });

      await tx.noteEtudiant.createMany({
        data: data.notes.map((n) => ({
          userId: data.userId,
          matiereId: n.matiereId,
          valeur: n.valeur,
          annee: n.annee,
        })),
      });

      return questionnaire;
    });
  }

  async findQuestionnaireByUserId(userId: string) {
    return prisma.questionnaire.findUnique({
      where: { userId },
    });
  }
}

