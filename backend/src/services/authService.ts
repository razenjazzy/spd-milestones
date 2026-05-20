import jwt from "jsonwebtoken";
import UserModel, { IUser } from "../models/User";
import { config } from "../config/env";

export interface JWTPayload {
  id: string;
  email: string;
  role: "admin" | "user";
  permissions?: {
    pages: string[];
    modules: string[];
    actions: Array<"view" | "add" | "edit" | "delete">;
  };
}

const getDefaultPermissions = (role: "admin" | "user") => ({
  pages: role === "admin" ? ["dashboard", "projects", "releases", "activities", "gantt", "calendar", "settings", "ai-cli", "tests"] : ["dashboard", "projects", "releases", "activities", "gantt", "calendar"],
  modules: role === "admin" ? ["projects", "milestones", "releases", "activities", "settings", "ai-cli"] : ["projects", "milestones", "releases", "activities"],
  actions: role === "admin" ? ["view", "add", "edit", "delete"] : ["view", "add", "edit"],
});

export const register = async (email: string, password: string, name?: string, role: "admin" | "user" = "user") => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const user = new UserModel({ email: normalizedEmail, password, name, role, permissions: getDefaultPermissions(role) });
  await user.save();
  return { id: user._id, email: user.email, role: user.role, permissions: user.permissions };
};

export const login = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
  return { id: user._id, email: user.email, role: user.role, permissions: user.permissions, token };
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

export const isAdmin = (user: JWTPayload): boolean => {
  return user.role === "admin";
};
