import { Session } from "@prisma/client";

export interface ISessionRepository {
  createSession(userId: string, token: string, expiresAt: Date): Promise<Session>;
  invalidateSession(token: string): Promise<void>;
  findSessionByToken(token: string): Promise<Session | null>;
  invalidateAllUserSessions(userId: string): Promise<void>;
}
