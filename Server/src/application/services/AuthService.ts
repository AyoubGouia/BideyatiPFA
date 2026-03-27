import bcrypt from "bcrypt";
import { generateToken } from "../../infrastructure/config/jwt";
import { computeJwtExpiresAt } from "../utils/jwtExpiry";
import { HttpError } from "../utils/httpError";
import { TokenPayload } from "../../domain/entities/Auth";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { SessionRepository } from "../../infrastructure/repositories/SessionRepository";

export class AuthService {
  private userRepository = new UserRepository();
  private sessionRepository = new SessionRepository();

  async register(input: {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
    motDePasse: string;
    numeroBAC: string;
    moyenneBac: number;
  }): Promise<{ token: string }> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, "Email already registered");
    }

    const motDePasseHash = await bcrypt.hash(input.motDePasse, 10);

    const { user } = await this.userRepository.createStudent({
      nom: input.nom,
      prenom: input.prenom,
      email: input.email,
      telephone: input.telephone ?? null,
      motDePasseHash,
      numeroBac: input.numeroBAC,
      moyenneBac: input.moyenneBac,
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);
    const expiresAt = computeJwtExpiresAt();
    await this.sessionRepository.invalidateAllUserSessions(user.id);
    await this.sessionRepository.createSession(user.id, token, expiresAt);

    return { token };
  }

  async login(input: { email: string; motDePasse: string }): Promise<{
    token: string;
    session: { id: string; token: string; dateExpiration: Date };
    user: { id: string; email: string; nom: string; prenom: string; role: string };
  }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const ok = await bcrypt.compare(input.motDePasse, user.motDePasseHash);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials");
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);
    const expiresAt = computeJwtExpiresAt();
    await this.sessionRepository.invalidateAllUserSessions(user.id);
    const session = await this.sessionRepository.createSession(user.id, token, expiresAt);

    return {
      token,
      session: {
        id: session.id,
        token: session.token,
        dateExpiration: session.dateExpiration,
      },
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }

  async logout(token: string | null | undefined): Promise<void> {
    if (!token) return;
    await this.sessionRepository.invalidateSession(token);
  }
}

