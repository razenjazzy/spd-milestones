import { Request, Response } from "express";
import * as authService from "../services/authService";
import { AuthRequest } from "../middlewares/authMiddleware";
import { config } from "../config/env";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, registrationKey } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const requestedRole = role === "admin" ? "admin" : "user";
    if (requestedRole === "admin" && (!config.adminRegistrationKey || registrationKey !== config.adminRegistrationKey)) {
      return res.status(403).json({ error: "Invalid admin registration key" });
    }

    const user = await authService.register(email, password, name, requestedRole);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Login failed" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json(req.user);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch user info" });
  }
};
