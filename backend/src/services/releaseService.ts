import ReleaseModel, { IRelease } from "../models/Release";
import ReleaseAccessCodeModel from "../models/ReleaseAccessCode";
import * as settingService from "./settingService";
import ActivityModel from "../models/Activity";

const RELEASE_ACTIVITY_TYPES = new Set(["release", "hotfix", "security"]);

const validateReleaseActivityLink = async (payload: Partial<IRelease>) => {
  if (!payload.activityId) return;

  const activity = await ActivityModel.findById(payload.activityId as any);
  if (!activity || activity.isDeleted) {
    throw new Error("Linked activity does not exist");
  }

  if (activity.scope !== "release") {
    throw new Error("Linked activity must be release-scoped");
  }

  if (!RELEASE_ACTIVITY_TYPES.has(String(activity.type || "").toLowerCase())) {
    throw new Error("Linked activity type must be release, hotfix, or security");
  }

  if (payload.projectId && activity.projectId && String(payload.projectId) !== String(activity.projectId)) {
    throw new Error("Release projectId must match linked activity projectId");
  }
};

export const listReleases = async (params: { projectId?: string; activityId?: string }) => {
  const query: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (params.projectId) query.projectId = params.projectId;
  if (params.activityId) query.activityId = params.activityId;
  return ReleaseModel.find(query).sort({ received: -1, createdAt: -1 });
};

export const createRelease = async (data: Partial<IRelease>) => {
  await validateReleaseActivityLink(data);
  return ReleaseModel.create(data);
};

export const updateRelease = async (
  id: string,
  data: Partial<IRelease> & { action?: "rejected" | "reopened" | "redeployed" | "updated"; historyReason?: string }
) => {
  const existing = await ReleaseModel.findById(id);
  if (!existing) return null;

  const candidate: Partial<IRelease> = {
    ...(existing.toObject() as any),
    ...data,
  };
  await validateReleaseActivityLink(candidate);

  const oldStatus = existing.status;
  const oldPipelineStage = existing.pipelineStage;

  if (data.action === "rejected") {
    (data as any).status = "halted";
  }
  if (data.action === "reopened") {
    (data as any).status = "staging";
  }
  if (data.action === "redeployed") {
    (data as any).pipelineStage = "release-for-production-upcoming";
  }

  Object.assign(existing, data);

  const newStatus = existing.status;
  const newPipelineStage = existing.pipelineStage;
  const changed =
    oldStatus !== newStatus ||
    oldPipelineStage !== newPipelineStage ||
    Boolean(data.action);

  if (changed) {
    existing.history = existing.history || [];
    existing.history.push({
      changedAt: new Date(),
      action: data.action || "updated",
      reason: data.historyReason,
      oldStatus,
      newStatus,
      oldPipelineStage,
      newPipelineStage,
    } as any);
  }

  return existing.save();
};

export const deleteRelease = async (id: string) => {
  return ReleaseModel.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
};

export const getReleaseById = async (id: string) => {
  return ReleaseModel.findById(id);
};

export const issueOneTimeCode = async (releaseId: string, createdBy: string, ttlMinutes: number) => {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return ReleaseAccessCodeModel.create({ releaseId, code, expiresAt, createdBy, used: false });
};

export const consumeOneTimeCode = async (releaseId: string, code: string) => {
  const hit = await ReleaseAccessCodeModel.findOne({
    releaseId,
    code,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!hit) return null;
  hit.used = true;
  await hit.save();
  return hit;
};

export const revealProtectedArtifact = async (
  releaseId: string,
  password: string,
  artifact: "downloadLink" | "dbScriptLink" | "jarAppLink"
) => {
  const release = await ReleaseModel.findById(releaseId);
  if (!release) return null;
  const settings = await settingService.getSettings();
  const sharedKey = (settings.passwordRevealKey || "").trim();
  const validByReleasePassword = Boolean(release.downloadPassword && release.downloadPassword === password);
  const validBySharedKey = Boolean(sharedKey && password === sharedKey);
  if (!validByReleasePassword && !validBySharedKey) return "invalid-password" as const;

  return {
    artifact,
    value: (release as any)[artifact] as string | undefined,
  };
};
