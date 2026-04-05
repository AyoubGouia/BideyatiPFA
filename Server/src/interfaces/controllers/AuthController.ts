import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../../application/services/AuthService";
import { HttpError } from "../../application/utils/httpError";
import { registerSchema, loginSchema } from "../validation/authSchemas";

const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("token="));
  if (!match) return null;
  return decodeURIComponent(match.slice("token=".length));
};

const setTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // sprint 1: dev-friendly. Set to true behind HTTPS.
  });
};

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const { token } = await this.authService.register(parsed);
      setTokenCookie(res, token);
      res.status(201).json({ token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await this.authService.login(parsed);
      setTokenCookie(res, result.token);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      res.status(500).json({ error: "Login failed" });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const token = getTokenFromRequest(req);
      await this.authService.logout(token);
      res.clearCookie("token");
      res.status(200).json({ message: "Logged out" });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      res.status(500).json({ error: "Logout failed" });
    }
  };
}

