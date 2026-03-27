import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../infrastructure/config/jwt";
import { prisma } from "../../infrastructure/config/prisma";

const getTokenFromCookieHeader = (cookieHeader: string | undefined): string | null => {
  if (!cookieHeader) return null;
  // Cookie header example: "token=abc; other=..."
  const match = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("token="));
  if (!match) return null;
  const raw = match.slice("token=".length);
  return decodeURIComponent(raw);
};

const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return getTokenFromCookieHeader(req.headers.cookie);
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ error: "Missing auth token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Ensure token is still valid server-side (supports logout).
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.dateExpiration.getTime() < Date.now()) {
      res.status(401).json({ error: "Session invalid or expired" });
      return;
    }

    req.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication middleware error" });
  }
};

