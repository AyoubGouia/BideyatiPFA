import { User, StudentProfile } from "@prisma/client";

export interface CreateStudentParams {
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  motDePasseHash: string;
  numeroBac: string;
  moyenneBac: number;
  section: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByNumeroBac(numeroBac: string): Promise<StudentProfile | null>;
  createStudent(data: CreateStudentParams): Promise<{ user: User; profile: StudentProfile }>;
}
