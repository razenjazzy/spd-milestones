import { Request, Response } from "express";
import * as activityService from "../services/activityService";

export const createActivity = async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body } as any;
    if (!payload.projectId && req.params.projectId) {
      payload.projectId = req.params.projectId;
      payload.scope = "project";
    }
    if (!payload.releaseId && (req.params as any).releaseId) {
      payload.releaseId = (req.params as any).releaseId;
      payload.scope = "release";
    }
    const activity = await activityService.createActivity(payload);
    res.status(201).json(activity);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create activity" });
  }
};

export const getActivitiesByProject = async (req: Request, res: Response) => {
  try {
    const projectId = (req.params.projectId || req.query.projectId) as string | undefined;
    const releaseId = ((req.params as any).releaseId || req.query.releaseId) as string | undefined;
    const activityKind = req.query.activityKind as string | undefined;

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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch activities" });
  }
};

export const updateActivity = async (req: Request, res: Response) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, req.body);
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    return res.json(activity);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update activity" });
  }
};

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const activity = await activityService.deleteActivity(req.params.id);
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    return res.json({ message: "Activity deleted", activity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to delete activity" });
  }
};

export const getDeletedActivities = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const releaseId = (req.params as any).releaseId as string | undefined;
    if (!projectId && !releaseId) return res.status(400).json({ error: "projectId or releaseId is required" });
    const activities = await activityService.getDeletedActivitiesByScope({ projectId, releaseId });
    return res.json(activities);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch deleted activities" });
  }
};

export const permanentDeleteActivity = async (req: Request, res: Response) => {
  try {
    const activity = await activityService.permanentDeleteActivity(req.params.id);
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    return res.json({ message: "Activity permanently deleted" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to permanently delete activity" });
  }
};

export const restoreActivity = async (req: Request, res: Response) => {
  try {
    const activity = await activityService.restoreActivity(req.params.id);
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    return res.json({ message: "Activity restored", activity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to restore activity" });
  }
};

export const copyMonthActivities = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;

    const { fromYear, fromMonth, toYear, toMonth } = req.body as {
      fromYear: number;
      fromMonth: number;
      toYear: number;
      toMonth: number;
    };

    if (!fromYear || !fromMonth || !toYear || !toMonth) {
      return res.status(400).json({ error: "fromYear, fromMonth, toYear and toMonth are required" });
    }

    const copied = await activityService.copyActivitiesToMonth(
      projectId ? String(projectId) : undefined,
      Number(fromYear),
      Number(fromMonth),
      Number(toYear),
      Number(toMonth)
    );

    return res.status(201).json({ copiedCount: copied.length, activities: copied });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to copy month activities" });
  }
};
