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
exports.executeAiCommand = void 0;
const activityService = __importStar(require("./activityService"));
const milestoneService = __importStar(require("./milestoneService"));
const projectService = __importStar(require("./projectService"));
const releaseService = __importStar(require("./releaseService"));
const geminiService_1 = require("./geminiService");
const geminiCliService_1 = require("./geminiCliService");
const env_1 = __importDefault(require("../config/env"));
const logger_1 = require("../utils/logger");
const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
const objectIdRegex = /\b([a-f0-9]{24})\b/i;
function extractId(prompt) {
    return prompt.match(objectIdRegex)?.[1];
}
function extractQuotedText(prompt) {
    const q = prompt.match(/"([^"]+)"/);
    return q?.[1]?.trim();
}
function extractAllDates(prompt) {
    return prompt.match(dateRegex) || [];
}
function extractType(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes("hotfix"))
        return "hotfix";
    if (p.includes("security"))
        return "security";
    if (p.includes("release"))
        return "release";
    return "maintenance";
}
function extractActivityScope(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes("standalone"))
        return "standalone";
    if (p.includes("release"))
        return "release";
    return "project";
}
function extractScopedObjectId(prompt, key) {
    const rx = new RegExp(`${key}\\s*[:=]\\s*([a-f0-9]{24})`, "i");
    return prompt.match(rx)?.[1];
}
function extractEnvironment(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes("production") || p.includes("prod"))
        return "production";
    return "staging";
}
function extractField(prompt, fieldName) {
    const rx = new RegExp(`${fieldName}\\s*[:=]\\s*"?([^",\\n]+)"?`, "i");
    return prompt.match(rx)?.[1]?.trim();
}
function resolveProjectIdFromPrompt(prompt, fallbackProjectId) {
    const explicit = extractField(prompt, "project");
    if (explicit && objectIdRegex.test(explicit)) {
        return explicit;
    }
    return fallbackProjectId;
}
function summarizeFallbackReason(reason) {
    if (!reason)
        return reason;
    const normalized = reason.toLowerCase();
    if (normalized.includes("daily quota") || normalized.includes("quota exceeded") || normalized.includes("429")) {
        return "Gemini quota exceeded. Fell back to the local parser.";
    }
    if (normalized.includes("trusted directory") || normalized.includes("trust workspace")) {
        return "Gemini CLI workspace trust was rejected. Fell back to the local parser.";
    }
    if (normalized.includes("api key") || normalized.includes("auth method")) {
        return "Gemini authentication is not configured correctly. Fell back to the local parser.";
    }
    return reason.length > 240 ? `${reason.slice(0, 237)}...` : reason;
}
function parseBulkMilestoneAdd(prompt, fallbackProjectId) {
    const p = prompt.toLowerCase();
    if (!p.includes("add") || !p.includes("milestone"))
        return null;
    const projectId = resolveProjectIdFromPrompt(prompt, fallbackProjectId);
    if (!projectId)
        return null;
    const segments = [...prompt.matchAll(/"([^"]+)"\s+start\s+(\d{4}-\d{2}-\d{2})\s+end\s+(\d{4}-\d{2}-\d{2})/gi)];
    if (segments.length < 2)
        return null;
    return segments.map((match, index) => ({
        entity: "milestone",
        action: "add",
        projectId,
        fields: {
            title: match[1].trim(),
            plannedStart: match[2],
            plannedEnd: match[3],
            order: index,
        },
    }));
}
function parseReplaceAllMilestones(prompt, fallbackProjectId) {
    const p = prompt.toLowerCase();
    if (!p.includes("delete all") || !p.includes("milestone") || !p.includes("add"))
        return null;
    const projectId = resolveProjectIdFromPrompt(prompt, fallbackProjectId);
    if (!projectId)
        return null;
    const promptBody = prompt.replace(/^.*?planned end date:\s*/i, "");
    const items = promptBody
        .split(";")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .map((segment, index) => {
        const match = segment.match(/^(.*),\s*team\s+([^,;]+),\s*status\s+([^,;]+),\s*start\s+(\d{4}-\d{2}-\d{2}),\s*end\s+(\d{4}-\d{2}-\d{2})\.?$/i);
        if (!match)
            return null;
        return {
            title: match[1].trim(),
            teamName: match[2].trim(),
            status: match[3].trim().toLowerCase(),
            plannedStart: match[4],
            plannedEnd: match[5],
            order: index,
        };
    })
        .filter((item) => Boolean(item));
    if (!items.length)
        return null;
    return {
        kind: "replace-milestones",
        projectId,
        items,
    };
}
function parsePromptToStructured(prompt, fallbackProjectId) {
    const raw = prompt.trim();
    const p = raw.toLowerCase();
    const replaceMilestones = parseReplaceAllMilestones(raw, fallbackProjectId);
    if (replaceMilestones) {
        return replaceMilestones;
    }
    const bulkMilestones = parseBulkMilestoneAdd(raw, fallbackProjectId);
    if (bulkMilestones) {
        return bulkMilestones;
    }
    if (p.includes("add project")) {
        const name = extractQuotedText(raw) || raw.replace(/.*add\s+project\s*/i, "").trim();
        if (!name)
            return null;
        return {
            entity: "project",
            action: "add",
            fields: { name },
        };
    }
    if (p.includes("update project")) {
        const id = extractId(raw);
        if (!id)
            return null;
        const name = extractField(raw, "name") || extractQuotedText(raw);
        const description = extractField(raw, "description");
        return {
            entity: "project",
            action: "update",
            id,
            fields: {
                ...(name ? { name } : {}),
                ...(description ? { description } : {}),
            },
        };
    }
    if (p.includes("delete project")) {
        const id = extractId(raw);
        if (!id)
            return null;
        return { entity: "project", action: "delete", id };
    }
    if (p.includes("add milestone")) {
        const projectId = resolveProjectIdFromPrompt(raw, fallbackProjectId);
        const title = extractQuotedText(raw);
        const dates = extractAllDates(raw);
        if (!projectId || !title || dates.length < 2)
            return null;
        return {
            entity: "milestone",
            action: "add",
            projectId,
            fields: {
                title,
                plannedStart: dates[0],
                plannedEnd: dates[1],
            },
        };
    }
    if (p.includes("update milestone")) {
        const id = extractId(raw);
        if (!id)
            return null;
        const title = extractField(raw, "title") || extractQuotedText(raw);
        const dates = extractAllDates(raw);
        if (dates.length >= 2) {
            return {
                entity: "milestone",
                action: "update",
                id,
                fields: {
                    plannedStart: dates[0],
                    plannedEnd: dates[1],
                    ...(title ? { title } : {}),
                    reason: "Updated by AI command",
                },
            };
        }
        return {
            entity: "milestone",
            action: "update",
            id,
            fields: {
                ...(title ? { title } : {}),
            },
        };
    }
    if (p.includes("delete milestone")) {
        const id = extractId(raw);
        if (!id)
            return null;
        return { entity: "milestone", action: "delete", id };
    }
    if (p.includes("add release")) {
        const projectId = resolveProjectIdFromPrompt(raw, fallbackProjectId);
        const releasePackage = extractQuotedText(raw) || extractField(raw, "release") || extractField(raw, "package");
        if (!releasePackage)
            return null;
        return {
            entity: "release",
            action: "add",
            projectId,
            fields: {
                releasePackage,
                status: extractField(raw, "status") || "staging",
                type: extractField(raw, "type") || "application-glitch",
            },
        };
    }
    if (p.includes("update release")) {
        const id = extractId(raw);
        if (!id)
            return null;
        const releasePackage = extractField(raw, "release") || extractField(raw, "package") || extractQuotedText(raw);
        return {
            entity: "release",
            action: "update",
            id,
            fields: {
                ...(releasePackage ? { releasePackage } : {}),
                ...(extractField(raw, "status") ? { status: extractField(raw, "status") } : {}),
                ...(extractField(raw, "type") ? { type: extractField(raw, "type") } : {}),
                ...(extractField(raw, "reason") ? { historyReason: extractField(raw, "reason") } : {}),
            },
        };
    }
    if (p.includes("delete release")) {
        const id = extractId(raw);
        if (!id)
            return null;
        return { entity: "release", action: "delete", id };
    }
    if (p.includes("add activity")) {
        const scope = extractActivityScope(raw);
        const projectId = scope === "project" ? resolveProjectIdFromPrompt(raw, fallbackProjectId) : undefined;
        const releaseId = scope === "release" ? extractScopedObjectId(raw, "release") : undefined;
        const date = extractAllDates(raw)[0];
        const title = extractQuotedText(raw) || raw.match(/add\s+activity\s+(.+?)(\s+on\s+\d{4}-\d{2}-\d{2}|$)/i)?.[1]?.trim();
        if (!date || !title)
            return null;
        return {
            entity: "activity",
            action: "add",
            projectId,
            fields: {
                title,
                date,
                scope,
                ...(projectId ? { projectId } : {}),
                ...(releaseId ? { releaseId } : {}),
                type: extractType(raw),
                environment: extractEnvironment(raw),
                ...(extractField(raw, "status") ? { status: extractField(raw, "status") } : {}),
                ...(extractField(raw, "reason") ? { statusReason: extractField(raw, "reason") } : {}),
                ...(extractField(raw, "platform") ? { platform: extractField(raw, "platform") } : {}),
            },
        };
    }
    if (p.includes("update activity")) {
        const id = extractId(raw);
        if (!id)
            return null;
        const dates = extractAllDates(raw);
        const title = extractField(raw, "title") || extractQuotedText(raw);
        const startTime = extractField(raw, "start") || extractField(raw, "startTime");
        const endTime = extractField(raw, "end") || extractField(raw, "endTime");
        const platform = extractField(raw, "platform");
        const environment = extractField(raw, "environment");
        const status = extractField(raw, "status");
        const statusReason = extractField(raw, "reason");
        const note = extractField(raw, "note");
        const scope = p.includes("standalone") ? "standalone" : p.includes("release") ? "release" : p.includes("project") ? "project" : undefined;
        const releaseId = extractScopedObjectId(raw, "release") || extractField(raw, "release");
        const projectId = extractScopedObjectId(raw, "project") || extractField(raw, "project");
        return {
            entity: "activity",
            action: "update",
            id,
            fields: {
                ...(title ? { title } : {}),
                ...(dates[0] ? { date: dates[0] } : {}),
                ...(scope ? { scope } : {}),
                ...(scope === "standalone" ? { projectId: undefined, releaseId: undefined } : {}),
                ...(scope === "release" && releaseId ? { releaseId, projectId: undefined } : {}),
                ...(scope === "project" && projectId ? { projectId, releaseId: undefined } : {}),
                ...(startTime ? { startTime } : {}),
                ...(endTime ? { endTime } : {}),
                ...(environment ? { environment } : {}),
                ...(status ? { status } : {}),
                ...(statusReason ? { statusReason } : {}),
                ...(platform ? { platform } : {}),
                ...(note ? { note } : {}),
            },
        };
    }
    if (p.includes("delete activity")) {
        const id = extractId(raw);
        if (!id)
            return null;
        return { entity: "activity", action: "delete", id };
    }
    return null;
}
const executeStructuredCommand = async (command) => {
    const ensureProjectExists = async (projectId) => {
        if (!projectId)
            throw new Error("projectId is required");
        const project = await projectService.getProjectById(projectId);
        if (!project)
            throw new Error("Referenced project does not exist");
        return project;
    };
    const ensureReleaseExists = async (releaseId) => {
        if (!releaseId)
            throw new Error("releaseId is required");
        const release = await releaseService.getReleaseById(releaseId);
        if (!release)
            throw new Error("Referenced release does not exist");
        return release;
    };
    if (command.entity === "project" && command.action === "add") {
        const created = await projectService.createProject((command.fields || {}));
        return { entity: "project", action: "add", result: created };
    }
    if (command.entity === "project" && command.action === "update") {
        if (!command.id)
            throw new Error("project id is required for update");
        const updated = await projectService.updateProject(command.id, (command.fields || {}));
        return { entity: "project", action: "update", result: updated };
    }
    if (command.entity === "project" && command.action === "delete") {
        if (!command.id)
            throw new Error("project id is required for delete");
        const deleted = await projectService.deleteProject(command.id);
        return { entity: "project", action: "delete", result: deleted };
    }
    if (command.entity === "milestone" && command.action === "add") {
        await ensureProjectExists(command.projectId);
        const created = await milestoneService.createMilestone({
            projectId: command.projectId,
            ...(command.fields || {}),
        });
        return { entity: "milestone", action: "add", result: created };
    }
    if (command.entity === "milestone" && command.action === "update") {
        if (!command.id)
            throw new Error("milestone id is required for update");
        const updated = await milestoneService.updateMilestone(command.id, (command.fields || {}));
        return { entity: "milestone", action: "update", result: updated };
    }
    if (command.entity === "milestone" && command.action === "delete") {
        if (!command.id)
            throw new Error("milestone id is required for delete");
        const deleted = await milestoneService.deleteMilestone(command.id);
        return { entity: "milestone", action: "delete", result: deleted };
    }
    if (command.entity === "activity" && command.action === "add") {
        const fields = (command.fields || {});
        const scope = fields.scope;
        if (scope === "project" || command.projectId) {
            await ensureProjectExists(fields.projectId || command.projectId);
        }
        if (scope === "release") {
            const release = await ensureReleaseExists(fields.releaseId);
            const normalizedType = String(fields.type || "").toLowerCase();
            if (!release.downloadLink && normalizedType !== "release" && normalizedType !== "hotfix" && normalizedType !== "security") {
                throw new Error("Release-scoped activity must be a deployment-linked release, hotfix, or security activity");
            }
        }
        const created = await activityService.createActivity({
            ...(command.projectId ? { projectId: command.projectId } : {}),
            ...fields,
        });
        return { entity: "activity", action: "add", result: created };
    }
    if (command.entity === "activity" && command.action === "update") {
        if (!command.id)
            throw new Error("activity id is required for update");
        const fields = (command.fields || {});
        const scope = fields.scope;
        if (scope === "project" && fields.projectId) {
            await ensureProjectExists(fields.projectId);
        }
        if (scope === "release" && fields.releaseId) {
            await ensureReleaseExists(fields.releaseId);
        }
        const updated = await activityService.updateActivity(command.id, fields);
        return { entity: "activity", action: "update", result: updated };
    }
    if (command.entity === "activity" && command.action === "delete") {
        if (!command.id)
            throw new Error("activity id is required for delete");
        const deleted = await activityService.deleteActivity(command.id);
        return { entity: "activity", action: "delete", result: deleted };
    }
    if (command.entity === "release" && command.action === "add") {
        const created = await releaseService.createRelease((command.fields || {}));
        return { entity: "release", action: "add", result: created };
    }
    if (command.entity === "release" && command.action === "update") {
        if (!command.id)
            throw new Error("release id is required for update");
        const updated = await releaseService.updateRelease(command.id, (command.fields || {}));
        return { entity: "release", action: "update", result: updated };
    }
    if (command.entity === "release" && command.action === "delete") {
        if (!command.id)
            throw new Error("release id is required for delete");
        const deleted = await releaseService.deleteRelease(command.id);
        return { entity: "release", action: "delete", result: deleted };
    }
    throw new Error("Command is recognized but not supported in v1");
};
const executeStructuredCommands = async (commands) => {
    const results = [];
    for (const command of commands) {
        results.push(await executeStructuredCommand(command));
    }
    return {
        entity: commands[0]?.entity,
        action: commands[0]?.action,
        batch: true,
        count: results.length,
        results,
    };
};
const executeReplaceMilestones = async (command) => {
    const existing = await milestoneService.getMilestonesByProject(command.projectId);
    const deleted = [];
    for (const milestone of existing) {
        const removed = await milestoneService.deleteMilestone(String(milestone._id));
        if (removed)
            deleted.push(removed);
    }
    const created = [];
    for (const item of command.items) {
        const next = await milestoneService.createMilestone({
            projectId: command.projectId,
            title: item.title,
            teamName: item.teamName,
            status: item.status,
            plannedStart: item.plannedStart,
            plannedEnd: item.plannedEnd,
            order: item.order,
        });
        created.push(next);
    }
    return {
        entity: "milestone",
        action: "replace",
        batch: true,
        deletedCount: deleted.length,
        createdCount: created.length,
        results: created,
    };
};
const executeAiCommand = async (params) => {
    const provider = params.provider || "local";
    logger_1.logger.info("AI command execution requested", {
        provider,
        hasPrompt: Boolean(params.prompt),
        hasStructuredCommand: Boolean(params.command),
        projectId: params.projectId || undefined,
    });
    if (params.command) {
        const structuredResult = await executeStructuredCommand(params.command);
        logger_1.logger.info("AI structured command executed", {
            providerUsed: "local",
            entity: structuredResult?.entity,
            action: structuredResult?.action,
        });
        return structuredResult;
    }
    let fromPrompt = null;
    let fallbackReason;
    if (params.prompt) {
        if (provider === "gemini-cli") {
            try {
                const cliResult = await (0, geminiCliService_1.runGeminiCliPrompt)({
                    prompt: params.prompt,
                    model: params.model,
                });
                if (!cliResult.ok) {
                    throw new Error(cliResult.errorOutput || `Gemini CLI exited with code ${cliResult.exitCode}`);
                }
                return cliResult;
            }
            catch (err) {
                if (!env_1.default.geminiFallbackToLocal) {
                    throw err;
                }
                fromPrompt = parsePromptToStructured(params.prompt, params.projectId);
                fallbackReason = summarizeFallbackReason(err?.message || "Gemini CLI execution failed");
                logger_1.logger.warn("Gemini CLI failed, fallback to local parser", { fallbackReason });
            }
        }
        else if (provider === "gemini") {
            try {
                fromPrompt = await (0, geminiService_1.parsePromptWithGemini)({
                    prompt: params.prompt,
                    projectId: params.projectId,
                    model: params.model,
                });
            }
            catch (err) {
                if (!env_1.default.geminiFallbackToLocal) {
                    throw err;
                }
                fromPrompt = parsePromptToStructured(params.prompt, params.projectId);
                fallbackReason = summarizeFallbackReason(err?.message || "Gemini parsing failed");
                logger_1.logger.warn("Gemini API parsing failed, fallback to local parser", { fallbackReason });
            }
        }
        else {
            fromPrompt = parsePromptToStructured(params.prompt, params.projectId);
        }
    }
    const command = fromPrompt;
    if (!command) {
        const noOpResult = {
            ok: true,
            status: "no-op",
            message: "Unable to parse command. No changes were applied.",
            providerUsed: (provider === "gemini" || provider === "gemini-cli") && fallbackReason ? "local" : provider,
            fallbackReason,
        };
        logger_1.logger.warn("AI prompt resulted in no-op", noOpResult);
        return noOpResult;
    }
    const executed = Array.isArray(command)
        ? await executeStructuredCommands(command)
        : "kind" in command
            ? await executeReplaceMilestones(command)
            : await executeStructuredCommand(command);
    const finalResult = {
        ...executed,
        providerUsed: (provider === "gemini" || provider === "gemini-cli") && fallbackReason ? "local" : provider,
        ...(fallbackReason ? { fallbackReason } : {}),
    };
    logger_1.logger.info("AI prompt command executed", {
        providerUsed: finalResult.providerUsed,
        fallbackReason,
        entity: executed?.entity,
        action: executed?.action,
    });
    return finalResult;
};
exports.executeAiCommand = executeAiCommand;
//# sourceMappingURL=aiCommandService.js.map