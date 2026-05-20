import { Request, Response } from "express";
import * as milestoneService from "../services/milestoneService";

export const createMilestone = async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body } as any;
    if (!payload.projectId && req.params.projectId) {
      payload.projectId = req.params.projectId;
    }
    const milestone = await milestoneService.createMilestone(payload);
    res.status(201).json(milestone);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getMilestonesByProject = async (req: Request, res: Response) => {
  const milestones = await milestoneService.getMilestonesByProject(req.params.projectId);
  res.json(milestones);
};

export const updateMilestone = async (req: Request, res: Response) => {
  const id = (req.params as any).id || (req.params as any).milestoneId;
  const milestone = await milestoneService.updateMilestone(id, req.body);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  res.json(milestone);
};

export const updateMilestoneDates = async (req: Request, res: Response) => {
  const { newStart, newEnd, reason } = req.body;
  const id = (req.params as any).id || (req.params as any).milestoneId;
  const milestone = await milestoneService.updateMilestoneDates(id, newStart, newEnd, reason);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  res.json(milestone);
};

export const deleteMilestone = async (req: Request, res: Response) => {
  const id = (req.params as any).id || (req.params as any).milestoneId;
  const milestone = await milestoneService.deleteMilestone(id);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  res.json({ message: "Milestone deleted", milestone });
};

export const restoreMilestone = async (req: Request, res: Response) => {
  const id = (req.params as any).id || (req.params as any).milestoneId;
  const milestone = await milestoneService.restoreMilestone(id);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  res.json({ message: "Milestone restored", milestone });
};

export const getDeletedMilestones = async (req: Request, res: Response) => {
  const milestones = await milestoneService.getDeletedMilestonesByProject(req.params.projectId);
  res.json(milestones);
};

export const permanentDeleteMilestone = async (req: Request, res: Response) => {
  const id = (req.params as any).id || (req.params as any).milestoneId;
  const milestone = await milestoneService.permanentDeleteMilestone(id);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  res.json({ message: "Milestone permanently deleted" });
};

export const reorderMilestones = async (req: Request, res: Response) => {
  try {
    const { milestones } = req.body; // Array of { id, order }
    const projectId = req.params.projectId;
    
    const updatedMilestones = await milestoneService.reorderMilestones(projectId, milestones);
    res.json(updatedMilestones);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateMilestoneOrder = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { order } = req.body;
    const updatedMilestones = await milestoneService.updateMilestoneOrder(projectId, order);
    res.status(200).json({ message: 'Milestone order updated successfully', milestones: updatedMilestones });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating milestone order', error: error.message });
  }
};
