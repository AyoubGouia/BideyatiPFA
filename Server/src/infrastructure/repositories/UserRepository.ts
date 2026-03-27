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

  async createStudent(data: CreateStudentParams): Promise<{ user: User; profile: StudentProfile }> {
    const created = await prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        motDePasseHash: data.motDePasseHash,
        actif: true,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            numeroBac: data.numeroBac,
            moyenneBac: data.moyenneBac,
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
