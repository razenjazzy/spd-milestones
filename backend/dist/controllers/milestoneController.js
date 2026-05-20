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
exports.updateMilestoneOrder = exports.reorderMilestones = exports.permanentDeleteMilestone = exports.getDeletedMilestones = exports.restoreMilestone = exports.deleteMilestone = exports.updateMilestoneDates = exports.updateMilestone = exports.getMilestonesByProject = exports.createMilestone = void 0;
const milestoneService = __importStar(require("../services/milestoneService"));
const createMilestone = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.projectId && req.params.projectId) {
            payload.projectId = req.params.projectId;
        }
        const milestone = await milestoneService.createMilestone(payload);
        res.status(201).json(milestone);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createMilestone = createMilestone;
const getMilestonesByProject = async (req, res) => {
    const milestones = await milestoneService.getMilestonesByProject(req.params.projectId);
    res.json(milestones);
};
exports.getMilestonesByProject = getMilestonesByProject;
const updateMilestone = async (req, res) => {
    const id = req.params.id || req.params.milestoneId;
    const milestone = await milestoneService.updateMilestone(id, req.body);
    if (!milestone)
        return res.status(404).json({ error: "Milestone not found" });
    res.json(milestone);
};
exports.updateMilestone = updateMilestone;
const updateMilestoneDates = async (req, res) => {
    const { newStart, newEnd, reason } = req.body;
    const id = req.params.id || req.params.milestoneId;
    const milestone = await milestoneService.updateMilestoneDates(id, newStart, newEnd, reason);
    if (!milestone)
        return res.status(404).json({ error: "Milestone not found" });
    res.json(milestone);
};
exports.updateMilestoneDates = updateMilestoneDates;
const deleteMilestone = async (req, res) => {
    const id = req.params.id || req.params.milestoneId;
    const milestone = await milestoneService.deleteMilestone(id);
    if (!milestone)
        return res.status(404).json({ error: "Milestone not found" });
    res.json({ message: "Milestone deleted", milestone });
};
exports.deleteMilestone = deleteMilestone;
const restoreMilestone = async (req, res) => {
    const id = req.params.id || req.params.milestoneId;
    const milestone = await milestoneService.restoreMilestone(id);
    if (!milestone)
        return res.status(404).json({ error: "Milestone not found" });
    res.json({ message: "Milestone restored", milestone });
};
exports.restoreMilestone = restoreMilestone;
const getDeletedMilestones = async (req, res) => {
    const milestones = await milestoneService.getDeletedMilestonesByProject(req.params.projectId);
    res.json(milestones);
};
exports.getDeletedMilestones = getDeletedMilestones;
const permanentDeleteMilestone = async (req, res) => {
    const id = req.params.id || req.params.milestoneId;
    const milestone = await milestoneService.permanentDeleteMilestone(id);
    if (!milestone)
        return res.status(404).json({ error: "Milestone not found" });
    res.json({ message: "Milestone permanently deleted" });
};
exports.permanentDeleteMilestone = permanentDeleteMilestone;
const reorderMilestones = async (req, res) => {
    try {
        const { milestones } = req.body; // Array of { id, order }
        const projectId = req.params.projectId;
        const updatedMilestones = await milestoneService.reorderMilestones(projectId, milestones);
        res.json(updatedMilestones);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.reorderMilestones = reorderMilestones;
const updateMilestoneOrder = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { order } = req.body;
        const updatedMilestones = await milestoneService.updateMilestoneOrder(projectId, order);
        res.status(200).json({ message: 'Milestone order updated successfully', milestones: updatedMilestones });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating milestone order', error: error.message });
    }
};
exports.updateMilestoneOrder = updateMilestoneOrder;
//# sourceMappingURL=milestoneController.js.map