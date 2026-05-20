"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyActivitiesToMonth = exports.restoreActivity = exports.permanentDeleteActivity = exports.getDeletedActivitiesByScope = exports.getDeletedActivitiesByProject = exports.deleteActivity = exports.updateActivity = exports.getActivitiesByMonth = exports.getActivitiesByProjectAndMonth = exports.getActivitiesByProject = exports.getActivities = exports.createActivity = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
const Project_1 = __importDefault(require("../models/Project"));
const Release_1 = __importDefault(require("../models/Release"));
const RELEASE_ACTIVITY_TYPES = new Set(["release", "hotfix", "security"]);
const validateActivitySemantics = async (payload) => {
    const scope = payload.scope || (payload.releaseId ? "release" : payload.projectId ? "project" : "standalone");
    if (scope === "standalone") {
        if (payload.projectId || payload.releaseId) {
            throw new Error("Standalone activity cannot include projectId or releaseId");
        }
        return;
    }
    if (scope === "project") {
        if (!payload.projectId) {
            throw new Error("Project-scoped activity requires projectId");
        }
        if (payload.releaseId) {
            throw new Error("Project-scoped activity cannot include releaseId");
        }
    }
    if (payload.projectId) {
        const projectExists = await Project_1.default.exists({ _id: payload.projectId });
        if (!projectExists)
            throw new Error("Referenced project does not exist");
    }
    if (scope === "release") {
        if (!payload.releaseId) {
            throw new Error("Release-scoped activity requires releaseId");
        }
        if (!RELEASE_ACTIVITY_TYPES.has(String(payload.type || "").toLowerCase())) {
            throw new Error("Release-scoped activity type must be release, hotfix, or security");
        }
    }
    if (payload.releaseId) {
        const release = await Release_1.default.findById(payload.releaseId);
        if (!release)
            throw new Error("Referenced release does not exist");
        if (scope !== "release") {
            throw new Error("releaseId can only be used for release-scoped activity");
        }
        if (release.projectId && payload.projectId && String(release.projectId) !== String(payload.projectId)) {
            throw new Error("Release projectId does not match activity projectId");
        }
    }
};
const createActivity = async (data) => {
    const payload = {
        status: data.status || "planned",
        environment: data.environment || "staging",
        scope: data.scope || (data.releaseId ? "release" : data.projectId ? "project" : "standalone"),
        ...data,
    };
    await validateActivitySemantics(payload);
    return Activity_1.default.create(payload);
};
exports.createActivity = createActivity;
const getActivities = async (params) => {
    const query = { isDeleted: { $ne: true } };
    if (params.projectId) {
        query.projectId = params.projectId;
    }
    if (params.releaseId) {
        query.releaseId = params.releaseId;
    }
    if (params.activityKind) {
        query.type = params.activityKind;
    }
    if (Number.isInteger(params.year) && Number.isInteger(params.month) && params.month >= 1 && params.month <= 12) {
        const year = Number(params.year);
        const month = Number(params.month);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);
        query.date = { $gte: monthStart, $lt: monthEnd };
    }
    else if (Number.isInteger(params.year)) {
        const year = Number(params.year);
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year + 1, 0, 1);
        query.date = { $gte: yearStart, $lt: yearEnd };
    }
    return Activity_1.default.find(query).sort({ date: 1, startTime: 1 });
};
exports.getActivities = getActivities;
const getActivitiesByProject = async (projectId) => {
    return Activity_1.default.find({ projectId, isDeleted: { $ne: true } }).sort({ date: 1, startTime: 1 });
};
exports.getActivitiesByProject = getActivitiesByProject;
const getActivitiesByProjectAndMonth = async (projectId, year, month) => {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    return Activity_1.default.find({
        projectId,
        isDeleted: { $ne: true },
        date: { $gte: monthStart, $lt: monthEnd },
    }).sort({ date: 1, startTime: 1 });
};
exports.getActivitiesByProjectAndMonth = getActivitiesByProjectAndMonth;
const getActivitiesByMonth = async (year, month) => {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    return Activity_1.default.find({
        isDeleted: { $ne: true },
        date: { $gte: monthStart, $lt: monthEnd },
    }).sort({ date: 1, startTime: 1 });
};
exports.getActivitiesByMonth = getActivitiesByMonth;
const updateActivity = async (id, data) => {
    const current = await Activity_1.default.findById(id);
    if (!current)
        return null;
    const nextStatus = data.status;
    if (nextStatus && nextStatus !== current.status) {
        current.history = current.history || [];
        current.history.push({
            changedAt: new Date(),
            oldStatus: current.status,
            newStatus: nextStatus,
            reason: data.statusReason || "Status updated",
        });
    }
    // Allow moving an activity cleanly across scopes.
    if (data.scope === "standalone") {
        data.projectId = undefined;
        data.releaseId = undefined;
    }
    else if (data.scope === "project") {
        data.releaseId = undefined;
    }
    else if (data.scope === "release") {
        if (!data.projectId) {
            data.projectId = current.projectId;
        }
    }
    const candidate = {
        ...current.toObject(),
        ...data,
    };
    await validateActivitySemantics(candidate);
    Object.assign(current, data);
    return current.save();
};
exports.updateActivity = updateActivity;
const deleteActivity = async (id) => {
    return Activity_1.default.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
    }, { new: true });
};
exports.deleteActivity = deleteActivity;
const getDeletedActivitiesByProject = async (projectId) => {
    return Activity_1.default.find({ projectId, isDeleted: true }).sort({ deletedAt: -1 });
};
exports.getDeletedActivitiesByProject = getDeletedActivitiesByProject;
const getDeletedActivitiesByScope = async (params) => {
    const query = { isDeleted: true };
    if (params.projectId)
        query.projectId = params.projectId;
    if (params.releaseId)
        query.releaseId = params.releaseId;
    return Activity_1.default.find(query).sort({ deletedAt: -1 });
};
exports.getDeletedActivitiesByScope = getDeletedActivitiesByScope;
const permanentDeleteActivity = async (id) => {
    return Activity_1.default.findByIdAndDelete(id);
};
exports.permanentDeleteActivity = permanentDeleteActivity;
const restoreActivity = async (id) => {
    return Activity_1.default.findByIdAndUpdate(id, {
        isDeleted: false,
        deletedAt: undefined,
    }, { new: true });
};
exports.restoreActivity = restoreActivity;
const copyActivitiesToMonth = async (projectId, fromYear, fromMonth, toYear, toMonth) => {
    const source = projectId
        ? await (0, exports.getActivitiesByProjectAndMonth)(projectId, fromYear, fromMonth)
        : await (0, exports.getActivitiesByMonth)(fromYear, fromMonth);
    const shifted = source.map((activity) => {
        const sourceDate = new Date(activity.date);
        const sourceMonthIndex = sourceDate.getMonth();
        const sourceYear = sourceDate.getFullYear();
        const monthOffset = (toYear - sourceYear) * 12 + (toMonth - 1 - sourceMonthIndex);
        const nextDate = new Date(sourceDate);
        nextDate.setMonth(nextDate.getMonth() + monthOffset);
        return {
            ...(activity.projectId ? { projectId: activity.projectId } : {}),
            title: activity.title,
            date: nextDate,
            type: activity.type,
            environment: activity.environment,
            status: activity.status || "planned",
            platform: activity.platform,
            startTime: activity.startTime,
            endTime: activity.endTime,
            duration: activity.duration,
            note: activity.note,
            color: activity.color,
            history: [],
        };
    });
    if (!shifted.length)
        return [];
    return Activity_1.default.insertMany(shifted);
};
exports.copyActivitiesToMonth = copyActivitiesToMonth;
//# sourceMappingURL=activityService.js.map