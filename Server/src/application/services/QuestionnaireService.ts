import { prisma } from "../../infrastructure/config/prisma";
import { HttpError } from "../utils/httpError";
import { QuestionnaireRepository } from "../../infrastructure/repositories/QuestionnaireRepository";

export class QuestionnaireService {
  private questionnaireRepository = new QuestionnaireRepository();

  private calculerScorePondere(moyenneBac: number): number {
    // Sprint 1: algo simplifie. On pourra raffiner plus tard selon les regles metier.
    return moyenneBac;
  }

  async submit(input: {
    userId: string;
    reponses: { question: string; reponse: string }[];
    notes: { valeur: number; annee: number; matiereId: string }[];
  }) {
    const existing = await this.questionnaireRepository.findQuestionnaireByUserId(input.userId);
    if (existing) {
      throw new HttpError(409, "Questionnaire already submitted");
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: input.userId },
    });

    if (!studentProfile) {
      throw new HttpError(400, "Student profile not found");
    }
    if (studentProfile.moyenneBac === null) {
      throw new HttpError(400, "moyenneBac is required to compute ProfilAcademique");
    }

    const moyenneBac = studentProfile.moyenneBac;
    const scorePondere = this.calculerScorePondere(moyenneBac);

    await this.questionnaireRepository.saveQuestionnaireAndNotes({
      userId: input.userId,
      reponses: input.reponses,
      notes: input.notes,
      moyenneBac,
      scorePondere,
    });
  }
}

