import { Role } from "@prisma/client";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
}

export interface AuthResult {
  token: string;
  user: AuthenticatedUser;
}
