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
      console.warn('[requireAuth] Authorization failed: Missing token in headers or cookies');
      res.status(401).json({ error: "Missing auth token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.warn('[requireAuth] Authorization failed: Token is invalid or expired');
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Ensure token is still valid server-side (supports logout).
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) {
      console.warn('[requireAuth] Authorization failed: Session not found in database');
      res.status(401).json({ error: "Session invalid or expired" });
      return;
    }
    
    if (session.dateExpiration.getTime() < Date.now()) {
      console.warn('[requireAuth] Authorization failed: Session has expired');
      res.status(401).json({ error: "Session invalid or expired" });
      return;
    }

    console.log('[requireAuth] Authorization successful for user:', payload.email);
    req.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error('[requireAuth] Internal error in middleware:', error);
    res.status(500).json({ error: "Authentication middleware error" });
  }
};

