import Milestone, { IMilestone, IIteration } from "../models/Milestone";
import { logger } from "../utils/logger";

export const createMilestone = async (data: Partial<IMilestone>) => {
  logger.service('MilestoneService', 'Creating milestone', { title: data.title, projectId: data.projectId });
  const milestone = await Milestone.create(data);
  logger.info('Milestone created successfully', { id: milestone._id, title: milestone.title });
  return milestone;
};

export const getMilestonesByProject = async (projectId: string) => {
  logger.service('MilestoneService', 'Fetching milestones by project', { projectId });
  const milestones = await Milestone.find({ projectId, isDeleted: { $ne: true } }).sort({ plannedStart: 1 });
  logger.debug('Milestones fetched', { projectId, count: milestones.length });
  return milestones;
};

export const getDeletedMilestonesByProject = async (projectId: string) => {
  logger.service('MilestoneService', 'Fetching deleted milestones', { projectId });
  const milestones = await Milestone.find({ projectId, isDeleted: true }).sort({ deletedAt: -1 });
  logger.debug('Deleted milestones fetched', { projectId, count: milestones.length });
  return milestones;
};

// Allow optional "reason" when updating to record iteration notes
export const updateMilestone = async (
  id: string,
  data: Partial<IMilestone> & { reason?: string }
) => {
  logger.service('MilestoneService', 'Updating milestone', { id, updates: Object.keys(data) });
  const milestone = await Milestone.findById(id);
  if (!milestone) {
    logger.warn('Milestone not found for update', { id });
    return null;
  }

  // Check if planned dates are changing to create iteration
  const plannedDatesChanged = 
    (data.plannedStart && new Date(data.plannedStart).getTime() !== milestone.plannedStart.getTime()) ||
    (data.plannedEnd && new Date(data.plannedEnd).getTime() !== milestone.plannedEnd.getTime());

  if (plannedDatesChanged) {
    logger.info('Milestone dates changed, creating iteration', { id, reason: data.reason });
    const iteration: IIteration = {
      changedAt: new Date(),
      oldPlannedStart: milestone.plannedStart,
      oldPlannedEnd: milestone.plannedEnd,
      newPlannedStart: data.plannedStart ? new Date(data.plannedStart) : milestone.plannedStart,
      newPlannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : milestone.plannedEnd,
      reason: data.reason || "Date updated",
    };

    milestone.iterations?.push(iteration);
  }

  // Update the milestone
  Object.assign(milestone, data);
  const updated = await milestone.save();
  logger.info('Milestone updated successfully', { id, title: updated.title });
  return updated;
};

// add iteration when planned dates change
export const updateMilestoneDates = async (
  id: string,
  newStart: Date,
  newEnd: Date,
  reason: string
) => {
  logger.service('MilestoneService', 'Updating milestone dates', { id, newStart, newEnd, reason });
  const milestone = await Milestone.findById(id);
  if (!milestone) {
    logger.warn('Milestone not found for date update', { id });
    return null;
  }

  const iteration: IIteration = {
    changedAt: new Date(),
    oldPlannedStart: milestone.plannedStart,
    oldPlannedEnd: milestone.plannedEnd,
    newPlannedStart: newStart,
    newPlannedEnd: newEnd,
    reason,
  };

  milestone.iterations?.push(iteration);
  milestone.plannedStart = newStart;
  milestone.plannedEnd = newEnd;

  const updated = await milestone.save();
  logger.info('Milestone dates updated successfully', { id, iterationCount: milestone.iterations?.length });
  return updated;
};

export const deleteMilestone = async (id: string) => {
  logger.service('MilestoneService', 'Soft deleting milestone', { id });
  const milestone = await Milestone.findByIdAndUpdate(id, { 
    isDeleted: true, 
    deletedAt: new Date() 
  }, { new: true });
  if (milestone) {
    logger.info('Milestone soft deleted', { id, title: milestone.title });
  }
  return milestone;
};

export const restoreMilestone = async (id: string) => {
  logger.service('MilestoneService', 'Restoring milestone', { id });
  const milestone = await Milestone.findByIdAndUpdate(id, { 
    isDeleted: false, 
    deletedAt: undefined 
  }, { new: true });
  if (milestone) {
    logger.info('Milestone restored', { id, title: milestone.title });
  }
  return milestone;
};

export const permanentDeleteMilestone = async (id: string) => {
  logger.service('MilestoneService', 'Permanently deleting milestone', { id });
  const milestone = await Milestone.findByIdAndDelete(id);
  if (milestone) {
    logger.warn('Milestone permanently deleted', { id, title: milestone.title });
  }
  return milestone;
};

export const reorderMilestones = async (projectId: string, milestones: { id: string; order: number }[]) => {
  logger.service('MilestoneService', 'Reordering milestones', { projectId, count: milestones.length });
  const updatePromises = milestones.map(({ id, order }) =>
    Milestone.findByIdAndUpdate(id, { order }, { new: true })
  );
  
  await Promise.all(updatePromises);
  logger.info('Milestones reordered successfully', { projectId });
  
  // Return updated milestones for the project
  return await getMilestonesByProject(projectId);
};

export const updateMilestoneOrder = async (projectId: string, order: string[]) => {
  logger.service('MilestoneService', 'Updating milestone order', { projectId, count: order.length });
  // Update each milestone with its new order index
  const updatePromises = order.map((milestoneId, index) =>
    Milestone.findByIdAndUpdate(milestoneId, { order: index }, { new: true })
  );
  
  await Promise.all(updatePromises);
  logger.info('Milestone order updated successfully', { projectId });
  
  // Return updated milestones for the project
  return await getMilestonesByProject(projectId);
};
