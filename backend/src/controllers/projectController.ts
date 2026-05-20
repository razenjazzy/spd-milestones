import { Request, Response } from "express";
import * as projectService from "../services/projectService";
import { getProjectGantt } from "../services/granttService";
import { getReleasePipelineSummary } from "../services/dashboardService";

export const createProject = async (req: Request, res: Response) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await projectService.getProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch projects' });
  }
};

import * as milestoneService from "../services/milestoneService";

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    // Fetch milestones for this project
    const milestones = await milestoneService.getMilestonesByProject(req.params.id);
    res.json({ ...project.toObject(), milestones });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await projectService.deleteProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete project' });
  }
};

export const getGantt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await getProjectGantt(id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch gantt data' });
  }
};

export const getDashboardPipeline = async (_req: Request, res: Response) => {
  try {
    const summary = await getReleasePipelineSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch release pipeline summary" });
  }
};
