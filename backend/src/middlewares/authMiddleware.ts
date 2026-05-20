import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
  user?: authService.JWTPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    logger.warn("Authentication failed", { error: err.message });
    res.status(401).json({ error: err.message || "Unauthorized" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!authService.isAdmin(req.user)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

export const requirePermission = (action: "view" | "add" | "edit" | "delete") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (authService.isAdmin(req.user)) {
      return next();
    }

    const permissions = req.user.permissions;
    if (!permissions || !permissions.actions?.includes(action)) {
      return res.status(403).json({ error: "Insufficient privileges" });
    }

    next();
  };
};

export const requireRole = (roles: Array<"admin" | "user">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient privileges" });
    }

    next();
  };
};
