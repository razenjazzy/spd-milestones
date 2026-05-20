import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as userService from "../services/userService";

export const listUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list users" });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create user" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update user" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete user" });
  }
};
