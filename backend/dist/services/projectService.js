"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const logger_1 = require("../utils/logger");
const createProject = async (data) => {
    logger_1.logger.service('ProjectService', 'Creating project', { name: data.name });
    const project = await Project_1.default.create(data);
    logger_1.logger.info('Project created successfully', { id: project._id, name: project.name });
    return project;
};
exports.createProject = createProject;
const getProjects = async () => {
    logger_1.logger.service('ProjectService', 'Fetching all projects');
    const projects = await Project_1.default.find().sort({ createdAt: -1 });
    logger_1.logger.debug('Projects fetched', { count: projects.length });
    return projects;
};
exports.getProjects = getProjects;
const getProjectById = async (id) => {
    logger_1.logger.service('ProjectService', 'Fetching project by ID', { id });
    const project = await Project_1.default.findById(id);
    if (!project) {
        logger_1.logger.warn('Project not found', { id });
    }
    return project;
};
exports.getProjectById = getProjectById;
const updateProject = async (id, data) => {
    logger_1.logger.service('ProjectService', 'Updating project', { id, updates: Object.keys(data) });
    const project = await Project_1.default.findByIdAndUpdate(id, data, { new: true });
    if (project) {
        logger_1.logger.info('Project updated successfully', { id, name: project.name });
    }
    else {
        logger_1.logger.warn('Project not found for update', { id });
    }
    return project;
};
exports.updateProject = updateProject;
const deleteProject = async (id) => {
    logger_1.logger.service('ProjectService', 'Deleting project', { id });
    const project = await Project_1.default.findByIdAndDelete(id);
    if (project) {
        logger_1.logger.info('Project deleted successfully', { id, name: project.name });
    }
    else {
        logger_1.logger.warn('Project not found for deletion', { id });
    }
    return project;
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=projectService.js.map