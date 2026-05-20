import { Response } from "express";
import * as releaseService from "../services/releaseService";
import * as settingService from "../services/settingService";
import { AuthRequest } from "../middlewares/authMiddleware";
import { config } from "../config/env";

export const listReleases = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, activityId } = req.query as { projectId?: string; activityId?: string };
    const releases = await releaseService.listReleases({ projectId, activityId });

    const isAdmin = req.user?.role === "admin";
    const masked = releases.map((r: any) => ({
      ...r.toObject(),
      downloadLink: isAdmin ? r.downloadLink : undefined,
      downloadPassword: isAdmin ? r.downloadPassword : undefined,
    }));

    return res.json(masked);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch releases" });
  }
};

export const createRelease = async (req: AuthRequest, res: Response) => {
  try {
    const created = await releaseService.createRelease(req.body);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create release" });
  }
};

export const updateRelease = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await releaseService.updateRelease(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Release not found" });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update release" });
  }
};

export const deleteRelease = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await releaseService.deleteRelease(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Release not found" });
    return res.json({ message: "Release deleted" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to delete release" });
  }
};

export const validateAdminAndGetLink = async (req: AuthRequest, res: Response) => {
  try {
    const { adminPassword } = req.body as { adminPassword?: string };
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const release = await releaseService.getReleaseById(req.params.id);
    if (!release) return res.status(404).json({ error: "Release not found" });

    if (!adminPassword || adminPassword !== config.adminLinkRevalidationPassword) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    return res.json({ downloadLink: release.downloadLink, downloadPassword: release.downloadPassword });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to validate admin" });
  }
};

export const createOneTimeShareCode = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id || req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    const settings = await settingService.getSettings();
    const record = await releaseService.issueOneTimeCode(req.params.id, req.user.id, settings.linkVisibilityTtlMinutes);
    return res.json({ code: record.code, expiresAt: record.expiresAt });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create one-time code" });
  }
};

export const resolveLinkByOneTimeCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body as { code?: string };
    if (!code) return res.status(400).json({ error: "code is required" });

    const consumed = await releaseService.consumeOneTimeCode(req.params.id, code);
    if (!consumed) return res.status(400).json({ error: "Invalid or expired code" });

    const release = await releaseService.getReleaseById(req.params.id);
    if (!release) return res.status(404).json({ error: "Release not found" });

    return res.json({ downloadLink: release.downloadLink, downloadPassword: release.downloadPassword });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to resolve link" });
  }
};

export const revealProtectedArtifact = async (req: AuthRequest, res: Response) => {
  try {
    const { password, artifact } = req.body as { password?: string; artifact?: "downloadLink" | "dbScriptLink" | "jarAppLink" };
    if (!password || !artifact) return res.status(400).json({ error: "password and artifact are required" });
    const result = await releaseService.revealProtectedArtifact(req.params.id, password, artifact);
    if (!result) return res.status(404).json({ error: "Release not found" });
    if (result === "invalid-password") return res.status(401).json({ error: "Invalid password" });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to reveal artifact" });
  }
};
