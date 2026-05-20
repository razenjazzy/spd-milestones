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
exports.copyMonthActivities = exports.restoreActivity = exports.permanentDeleteActivity = exports.getDeletedActivities = exports.deleteActivity = exports.updateActivity = exports.getActivitiesByProject = exports.createActivity = void 0;
const activityService = __importStar(require("../services/activityService"));
const createActivity = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.projectId && req.params.projectId) {
            payload.projectId = req.params.projectId;
            payload.scope = "project";
        }
        if (!payload.releaseId && req.params.releaseId) {
            payload.releaseId = req.params.releaseId;
            payload.scope = "release";
        }
        const activity = await activityService.createActivity(payload);
        res.status(201).json(activity);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create activity" });
    }
};
exports.createActivity = createActivity;
const getActivitiesByProject = async (req, res) => {
    try {
        const projectId = (req.params.projectId || req.query.projectId);
        const releaseId = (req.params.releaseId || req.query.releaseId);
        const activityKind = req.query.activityKind;
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const activities = await activityService.getActivities({
            projectId,
            releaseId,
            year: Number.isInteger(year) ? year : undefined,
            month: Number.isInteger(month) ? month : undefined,
            activityKind,
        });
        return res.json(activities);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to fetch activities" });
    }
};
exports.getActivitiesByProject = getActivitiesByProject;
const updateActivity = async (req, res) => {
    try {
        const activity = await activityService.updateActivity(req.params.id, req.body);
        if (!activity)
            return res.status(404).json({ error: "Activity not found" });
        return res.json(activity);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to update activity" });
    }
};
exports.updateActivity = updateActivity;
const deleteActivity = async (req, res) => {
    try {
        const activity = await activityService.deleteActivity(req.params.id);
        if (!activity)
            return res.status(404).json({ error: "Activity not found" });
        return res.json({ message: "Activity deleted", activity });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to delete activity" });
    }
};
exports.deleteActivity = deleteActivity;
const getDeletedActivities = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const releaseId = req.params.releaseId;
        if (!projectId && !releaseId)
            return res.status(400).json({ error: "projectId or releaseId is required" });
        const activities = await activityService.getDeletedActivitiesByScope({ projectId, releaseId });
        return res.json(activities);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to fetch deleted activities" });
    }
};
exports.getDeletedActivities = getDeletedActivities;
const permanentDeleteActivity = async (req, res) => {
    try {
        const activity = await activityService.permanentDeleteActivity(req.params.id);
        if (!activity)
            return res.status(404).json({ error: "Activity not found" });
        return res.json({ message: "Activity permanently deleted" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to permanently delete activity" });
    }
};
exports.permanentDeleteActivity = permanentDeleteActivity;
const restoreActivity = async (req, res) => {
    try {
        const activity = await activityService.restoreActivity(req.params.id);
        if (!activity)
            return res.status(404).json({ error: "Activity not found" });
        return res.json({ message: "Activity restored", activity });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to restore activity" });
    }
};
exports.restoreActivity = restoreActivity;
const copyMonthActivities = async (req, res) => {
    try {
        const projectId = req.params.projectId || req.body.projectId;
        const { fromYear, fromMonth, toYear, toMonth } = req.body;
        if (!fromYear || !fromMonth || !toYear || !toMonth) {
            return res.status(400).json({ error: "fromYear, fromMonth, toYear and toMonth are required" });
        }
        const copied = await activityService.copyActivitiesToMonth(projectId ? String(projectId) : undefined, Number(fromYear), Number(fromMonth), Number(toYear), Number(toMonth));
        return res.status(201).json({ copiedCount: copied.length, activities: copied });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to copy month activities" });
    }
};
exports.copyMonthActivities = copyMonthActivities;
//# sourceMappingURL=activityController.js.map