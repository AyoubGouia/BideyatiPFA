import { Role, StudentProfile, User } from "@prisma/client";
import { CreateStudentParams, IUserRepository } from "../../domain/repositories/IUserRepository";
import { prisma } from "../config/prisma";

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByNumeroBac(numeroBac: string): Promise<StudentProfile | null> {
    return prisma.studentProfile.findUnique({ where: { numeroBac } });
  }

  private sectionMapping: Record<string, string> = {
    Math: "رياضيات",
    Science: "علوم تجريبية",
    Info: "علوم الإعلامية",
    Technique: "العلوم التقنية",
    Lettre: "آداب",
    "Économie": "إقتصاد وتصرف",
    Sport: "رياضة",
  };

  async createStudent(data: CreateStudentParams): Promise<{ user: User; profile: StudentProfile }> {
    const sectionNom = this.sectionMapping[data.section] || data.section;

    const created = await prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        motDePasseHash: data.motDePasseHash,
        actif: true,
        role: Role.STUDENT,
        section: {
          connectOrCreate: {
            where: { nom: sectionNom },
            create: { nom: sectionNom }
          }
        },
        studentProfile: {
          create: {
            numeroBac: data.numeroBac,
            moyenneBac: data.moyenneBac,
            score: data.score,
            region: data.region,
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    if (!created.studentProfile) {
      // Should never happen, but keeps TS safe.
      throw new Error("Failed to create student profile");
    }

    return { user: created, profile: created.studentProfile };
  }
}
