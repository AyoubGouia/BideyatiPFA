import { Questionnaire, ReponseQuestionnaire, ProfilAcademique, NoteEtudiant } from "@prisma/client";

export interface SaveQuestionnaireParams {
  userId: string;
  reponses: { question: string; reponse: string }[];
  notes: { valeur: number; annee: number; matiereId: string }[];
  moyenneBac: number;
  scorePondere: number;
}

export interface IQuestionnaireRepository {
  saveQuestionnaireAndNotes(data: SaveQuestionnaireParams): Promise<Questionnaire>;
  findQuestionnaireByUserId(userId: string): Promise<Questionnaire | null>;
}
