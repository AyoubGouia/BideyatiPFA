import { prisma } from "../../infrastructure/config/prisma";
import bcrypt from "bcrypt";
import { HttpError } from "../utils/httpError";

export class ProfileService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        section: true,
        questionnaire: {
          include: {
            reponses: true,
            profilAcademique: true,
          },
        },
        notes: {
          include: {
            matiere: true,
          },
          orderBy: { annee: 'desc' },
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
            score: user.studentProfile.score,
            region: user.studentProfile.region,
          }
        : null,
      section: user.section
        ? {
            nom: user.section.nom,
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
      notes: user.notes.map((n: { id: string; valeur: number; annee: number; matiere: { nom: string } }) => ({
        id: n.id,
        valeur: n.valeur,
        annee: n.annee,
        matiereNom: n.matiere.nom,
      })),
    };
  }

  async updateNotes(
    userId: string,
    notes: { matiereNom: string; valeur: number }[],
    newMoyenneBac: number,
    newScore: number,
  ) {
    // Upsert each note: find matiere by name, then update-or-create the NoteEtudiant
    const year = new Date().getFullYear();
    for (const note of notes) {
      let matiere = await prisma.matiere.findFirst({ where: { nom: note.matiereNom } });
      if (!matiere) {
        matiere = await prisma.matiere.create({ data: { nom: note.matiereNom } });
      }
      const existing = await prisma.noteEtudiant.findFirst({
        where: { userId, matiereId: matiere.id },
      });
      if (existing) {
        await prisma.noteEtudiant.update({
          where: { id: existing.id },
          data: { valeur: note.valeur, annee: year },
        });
      } else {
        await prisma.noteEtudiant.create({
          data: { userId, matiereId: matiere.id, valeur: note.valeur, annee: year },
        });
      }
    }
    // Recalculate and persist the new moyenneBac and score in studentProfile
    await prisma.studentProfile.update({
      where: { userId },
      data: { moyenneBac: newMoyenneBac, score: newScore },
    });
  }

  async updateSettings(userId: string, data: any) {
    const userUpdate: any = {};
    const profileUpdate: any = {};

    if (data.nom) userUpdate.nom = data.nom;
    if (data.prenom) userUpdate.prenom = data.prenom;
    if (data.email) userUpdate.email = data.email;
    if (data.dateNaissance) userUpdate.dateNaissance = new Date(data.dateNaissance);
    if (data.motDePasse) {
      userUpdate.motDePasseHash = await bcrypt.hash(data.motDePasse, 10);
    }

    if (data.numeroBAC) profileUpdate.numeroBac = data.numeroBAC;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.studentProfile.update({
        where: { userId },
        data: profileUpdate,
      });
    }
  }
}

