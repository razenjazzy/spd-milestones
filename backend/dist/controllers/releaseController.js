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
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealProtectedArtifact = exports.resolveLinkByOneTimeCode = exports.createOneTimeShareCode = exports.validateAdminAndGetLink = exports.deleteRelease = exports.updateRelease = exports.createRelease = exports.listReleases = void 0;
const releaseService = __importStar(require("../services/releaseService"));
const settingService = __importStar(require("../services/settingService"));
const env_1 = require("../config/env");
const listReleases = async (req, res) => {
    try {
        const { projectId, activityId } = req.query;
        const releases = await releaseService.listReleases({ projectId, activityId });
        const isAdmin = req.user?.role === "admin";
        const masked = releases.map((r) => ({
            ...r.toObject(),
            downloadLink: isAdmin ? r.downloadLink : undefined,
            downloadPassword: isAdmin ? r.downloadPassword : undefined,
        }));
        return res.json(masked);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to fetch releases" });
    }
};
exports.listReleases = listReleases;
const createRelease = async (req, res) => {
    try {
        const created = await releaseService.createRelease(req.body);
        return res.status(201).json(created);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || "Failed to create release" });
    }
};
exports.createRelease = createRelease;
const updateRelease = async (req, res) => {
    try {
        const updated = await releaseService.updateRelease(req.params.id, req.body);
        if (!updated)
            return res.status(404).json({ error: "Release not found" });
        return res.json(updated);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || "Failed to update release" });
    }
};
exports.updateRelease = updateRelease;
const deleteRelease = async (req, res) => {
    try {
        const deleted = await releaseService.deleteRelease(req.params.id);
        if (!deleted)
            return res.status(404).json({ error: "Release not found" });
        return res.json({ message: "Release deleted" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to delete release" });
    }
};
exports.deleteRelease = deleteRelease;
const validateAdminAndGetLink = async (req, res) => {
    try {
        const { adminPassword } = req.body;
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        const release = await releaseService.getReleaseById(req.params.id);
        if (!release)
            return res.status(404).json({ error: "Release not found" });
        if (!adminPassword || adminPassword !== env_1.config.adminLinkRevalidationPassword) {
            return res.status(401).json({ error: "Invalid admin password" });
        }
        return res.json({ downloadLink: release.downloadLink, downloadPassword: release.downloadPassword });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to validate admin" });
    }
};
exports.validateAdminAndGetLink = validateAdminAndGetLink;
const createOneTimeShareCode = async (req, res) => {
    try {
        if (!req.user?.id || req.user.role !== "admin")
            return res.status(403).json({ error: "Admin access required" });
        const settings = await settingService.getSettings();
        const record = await releaseService.issueOneTimeCode(req.params.id, req.user.id, settings.linkVisibilityTtlMinutes);
        return res.json({ code: record.code, expiresAt: record.expiresAt });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to create one-time code" });
    }
};
exports.createOneTimeShareCode = createOneTimeShareCode;
const resolveLinkByOneTimeCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code)
            return res.status(400).json({ error: "code is required" });
        const consumed = await releaseService.consumeOneTimeCode(req.params.id, code);
        if (!consumed)
            return res.status(400).json({ error: "Invalid or expired code" });
        const release = await releaseService.getReleaseById(req.params.id);
        if (!release)
            return res.status(404).json({ error: "Release not found" });
        return res.json({ downloadLink: release.downloadLink, downloadPassword: release.downloadPassword });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to resolve link" });
    }
};
exports.resolveLinkByOneTimeCode = resolveLinkByOneTimeCode;
const revealProtectedArtifact = async (req, res) => {
    try {
        const { password, artifact } = req.body;
        if (!password || !artifact)
            return res.status(400).json({ error: "password and artifact are required" });
        const result = await releaseService.revealProtectedArtifact(req.params.id, password, artifact);
        if (!result)
            return res.status(404).json({ error: "Release not found" });
        if (result === "invalid-password")
            return res.status(401).json({ error: "Invalid password" });
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to reveal artifact" });
    }
};
exports.revealProtectedArtifact = revealProtectedArtifact;
//# sourceMappingURL=releaseController.js.map