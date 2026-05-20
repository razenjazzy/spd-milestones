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
exports.getDashboardPipeline = exports.getGantt = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const projectService = __importStar(require("../services/projectService"));
const granttService_1 = require("../services/granttService");
const dashboardService_1 = require("../services/dashboardService");
const createProject = async (req, res) => {
    try {
        const project = await projectService.createProject(req.body);
        res.status(201).json(project);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createProject = createProject;
const getProjects = async (_req, res) => {
    try {
        const projects = await projectService.getProjects();
        res.json(projects);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch projects' });
    }
};
exports.getProjects = getProjects;
const milestoneService = __importStar(require("../services/milestoneService"));
const getProjectById = async (req, res) => {
    try {
        const project = await projectService.getProjectById(req.params.id);
        if (!project)
            return res.status(404).json({ error: "Project not found" });
        // Fetch milestones for this project
        const milestones = await milestoneService.getMilestonesByProject(req.params.id);
        res.json({ ...project.toObject(), milestones });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch project' });
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res) => {
    try {
        const project = await projectService.updateProject(req.params.id, req.body);
        if (!project)
            return res.status(404).json({ error: "Project not found" });
        res.json(project);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to update project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const project = await projectService.deleteProject(req.params.id);
        if (!project)
            return res.status(404).json({ error: "Project not found" });
        res.json({ message: "Project deleted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
const getGantt = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await (0, granttService_1.getProjectGantt)(id);
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch gantt data' });
    }
};
exports.getGantt = getGantt;
const getDashboardPipeline = async (_req, res) => {
    try {
        const summary = await (0, dashboardService_1.getReleasePipelineSummary)();
        res.json(summary);
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Failed to fetch release pipeline summary" });
    }
};
exports.getDashboardPipeline = getDashboardPipeline;
//# sourceMappingURL=projectController.js.map