import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as settingService from "../services/settingService";

export const getSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await settingService.getSettings();
    return res.json(settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to load settings" });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await settingService.updateSettings(req.body || {});
    return res.json(settings);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update settings" });
  }
};
