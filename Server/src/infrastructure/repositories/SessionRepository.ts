import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { prisma } from "../config/prisma";

export class SessionRepository implements ISessionRepository {
  async createSession(userId: string, token: string, expiresAt: Date) {
    return prisma.session.create({
      data: {
        userId,
        token,
        dateExpiration: expiresAt,
      },
    });
  }

  async invalidateSession(token: string) {
    await prisma.session.deleteMany({ where: { token } });
  }

  async findSessionByToken(token: string) {
    return prisma.session.findUnique({ where: { token } });
  }

  async invalidateAllUserSessions(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
  }
}

