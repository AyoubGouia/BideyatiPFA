import { prisma } from "../../infrastructure/config/prisma";
import { HttpError } from "../utils/httpError";

export class ProfileService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        questionnaire: {
          include: {
            reponses: true,
            profilAcademique: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      actif: user.actif,
      dateCreation: user.dateCreation,
      studentProfile: user.studentProfile
        ? {
            numeroBac: user.studentProfile.numeroBac,
            moyenneBac: user.studentProfile.moyenneBac,
          }
        : null,
      questionnaire: user.questionnaire
        ? {
            id: user.questionnaire.id,
            dateSoumission: user.questionnaire.dateSoumission,
            reponses: user.questionnaire.reponses.map(
              (r: { question: string; reponse: string }) => ({
              question: r.question,
              reponse: r.reponse,
              })
            ),
            profilAcademique: user.questionnaire.profilAcademique
              ? {
                  moyenneBac: user.questionnaire.profilAcademique.moyenneBac,
                  scorePondere: user.questionnaire.profilAcademique.scorePondere,
                }
              : null,
          }
        : null,
    };
  }
}

