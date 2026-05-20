"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealProtectedArtifact = exports.consumeOneTimeCode = exports.issueOneTimeCode = exports.getReleaseById = exports.deleteRelease = exports.updateRelease = exports.createRelease = exports.listReleases = void 0;
const Release_1 = __importDefault(require("../models/Release"));
const ReleaseAccessCode_1 = __importDefault(require("../models/ReleaseAccessCode"));
const settingService = __importStar(require("./settingService"));
const Activity_1 = __importDefault(require("../models/Activity"));
const RELEASE_ACTIVITY_TYPES = new Set(["release", "hotfix", "security"]);
const validateReleaseActivityLink = async (payload) => {
    if (!payload.activityId)
        return;
    const activity = await Activity_1.default.findById(payload.activityId);
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
const listReleases = async (params) => {
    const query = { isDeleted: { $ne: true } };
    if (params.projectId)
        query.projectId = params.projectId;
    if (params.activityId)
        query.activityId = params.activityId;
    return Release_1.default.find(query).sort({ received: -1, createdAt: -1 });
};
exports.listReleases = listReleases;
const createRelease = async (data) => {
    await validateReleaseActivityLink(data);
    return Release_1.default.create(data);
};
exports.createRelease = createRelease;
const updateRelease = async (id, data) => {
    const existing = await Release_1.default.findById(id);
    if (!existing)
        return null;
    const candidate = {
        ...existing.toObject(),
        ...data,
    };
    await validateReleaseActivityLink(candidate);
    const oldStatus = existing.status;
    const oldPipelineStage = existing.pipelineStage;
    if (data.action === "rejected") {
        data.status = "halted";
    }
    if (data.action === "reopened") {
        data.status = "staging";
    }
    if (data.action === "redeployed") {
        data.pipelineStage = "release-for-production-upcoming";
    }
    Object.assign(existing, data);
    const newStatus = existing.status;
    const newPipelineStage = existing.pipelineStage;
    const changed = oldStatus !== newStatus ||
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
        });
    }
    return existing.save();
};
exports.updateRelease = updateRelease;
const deleteRelease = async (id) => {
    return Release_1.default.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
};
exports.deleteRelease = deleteRelease;
const getReleaseById = async (id) => {
    return Release_1.default.findById(id);
};
exports.getReleaseById = getReleaseById;
const issueOneTimeCode = async (releaseId, createdBy, ttlMinutes) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    return ReleaseAccessCode_1.default.create({ releaseId, code, expiresAt, createdBy, used: false });
};
exports.issueOneTimeCode = issueOneTimeCode;
const consumeOneTimeCode = async (releaseId, code) => {
    const hit = await ReleaseAccessCode_1.default.findOne({
        releaseId,
        code,
        used: false,
        expiresAt: { $gt: new Date() },
    });
    if (!hit)
        return null;
    hit.used = true;
    await hit.save();
    return hit;
};
exports.consumeOneTimeCode = consumeOneTimeCode;
const revealProtectedArtifact = async (releaseId, password, artifact) => {
    const release = await Release_1.default.findById(releaseId);
    if (!release)
        return null;
    const settings = await settingService.getSettings();
    const sharedKey = (settings.passwordRevealKey || "").trim();
    const validByReleasePassword = Boolean(release.downloadPassword && release.downloadPassword === password);
    const validBySharedKey = Boolean(sharedKey && password === sharedKey);
    if (!validByReleasePassword && !validBySharedKey)
        return "invalid-password";
    return {
        artifact,
        value: release[artifact],
    };
};
exports.revealProtectedArtifact = revealProtectedArtifact;
//# sourceMappingURL=releaseService.js.map