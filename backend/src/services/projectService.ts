import Project, { IProject } from "../models/Project";
import { logger } from "../utils/logger";

export const createProject = async (data: Partial<IProject>) => {
  logger.service('ProjectService', 'Creating project', { name: data.name });
  const project = await Project.create(data);
  logger.info('Project created successfully', { id: project._id, name: project.name });
  return project;
};

export const getProjects = async () => {
  logger.service('ProjectService', 'Fetching all projects');
  const projects = await Project.find().sort({ createdAt: -1 });
  logger.debug('Projects fetched', { count: projects.length });
  return projects;
};

export const getProjectById = async (id: string) => {
  logger.service('ProjectService', 'Fetching project by ID', { id });
  const project = await Project.findById(id);
  if (!project) {
    logger.warn('Project not found', { id });
  }
  return project;
};

export const updateProject = async (id: string, data: Partial<IProject>) => {
  logger.service('ProjectService', 'Updating project', { id, updates: Object.keys(data) });
  const project = await Project.findByIdAndUpdate(id, data, { new: true });
  if (project) {
    logger.info('Project updated successfully', { id, name: project.name });
  } else {
    logger.warn('Project not found for update', { id });
  }
  return project;
};

export const deleteProject = async (id: string) => {
  logger.service('ProjectService', 'Deleting project', { id });
  const project = await Project.findByIdAndDelete(id);
  if (project) {
    logger.info('Project deleted successfully', { id, name: project.name });
  } else {
    logger.warn('Project not found for deletion', { id });
  }
  return project;
};
