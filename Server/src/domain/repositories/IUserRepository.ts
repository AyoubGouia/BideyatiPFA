import { User, StudentProfile } from "@prisma/client";

export interface CreateStudentParams {
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  motDePasseHash: string;
  numeroBac: string;
  moyenneBac: number;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createStudent(data: CreateStudentParams): Promise<{ user: User; profile: StudentProfile }>;
}
