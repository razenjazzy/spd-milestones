"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMilestoneOrder = exports.reorderMilestones = exports.permanentDeleteMilestone = exports.restoreMilestone = exports.deleteMilestone = exports.updateMilestoneDates = exports.updateMilestone = exports.getDeletedMilestonesByProject = exports.getMilestonesByProject = exports.createMilestone = void 0;
const Milestone_1 = __importDefault(require("../models/Milestone"));
const logger_1 = require("../utils/logger");
const createMilestone = async (data) => {
    logger_1.logger.service('MilestoneService', 'Creating milestone', { title: data.title, projectId: data.projectId });
    const milestone = await Milestone_1.default.create(data);
    logger_1.logger.info('Milestone created successfully', { id: milestone._id, title: milestone.title });
    return milestone;
};
exports.createMilestone = createMilestone;
const getMilestonesByProject = async (projectId) => {
    logger_1.logger.service('MilestoneService', 'Fetching milestones by project', { projectId });
    const milestones = await Milestone_1.default.find({ projectId, isDeleted: { $ne: true } }).sort({ plannedStart: 1 });
    logger_1.logger.debug('Milestones fetched', { projectId, count: milestones.length });
    return milestones;
};
exports.getMilestonesByProject = getMilestonesByProject;
const getDeletedMilestonesByProject = async (projectId) => {
    logger_1.logger.service('MilestoneService', 'Fetching deleted milestones', { projectId });
    const milestones = await Milestone_1.default.find({ projectId, isDeleted: true }).sort({ deletedAt: -1 });
    logger_1.logger.debug('Deleted milestones fetched', { projectId, count: milestones.length });
    return milestones;
};
exports.getDeletedMilestonesByProject = getDeletedMilestonesByProject;
// Allow optional "reason" when updating to record iteration notes
const updateMilestone = async (id, data) => {
    logger_1.logger.service('MilestoneService', 'Updating milestone', { id, updates: Object.keys(data) });
    const milestone = await Milestone_1.default.findById(id);
    if (!milestone) {
        logger_1.logger.warn('Milestone not found for update', { id });
        return null;
    }
    // Check if planned dates are changing to create iteration
    const plannedDatesChanged = (data.plannedStart && new Date(data.plannedStart).getTime() !== milestone.plannedStart.getTime()) ||
        (data.plannedEnd && new Date(data.plannedEnd).getTime() !== milestone.plannedEnd.getTime());
    if (plannedDatesChanged) {
        logger_1.logger.info('Milestone dates changed, creating iteration', { id, reason: data.reason });
        const iteration = {
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
    logger_1.logger.info('Milestone updated successfully', { id, title: updated.title });
    return updated;
};
exports.updateMilestone = updateMilestone;
// add iteration when planned dates change
const updateMilestoneDates = async (id, newStart, newEnd, reason) => {
    logger_1.logger.service('MilestoneService', 'Updating milestone dates', { id, newStart, newEnd, reason });
    const milestone = await Milestone_1.default.findById(id);
    if (!milestone) {
        logger_1.logger.warn('Milestone not found for date update', { id });
        return null;
    }
    const iteration = {
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
    logger_1.logger.info('Milestone dates updated successfully', { id, iterationCount: milestone.iterations?.length });
    return updated;
};
exports.updateMilestoneDates = updateMilestoneDates;
const deleteMilestone = async (id) => {
    logger_1.logger.service('MilestoneService', 'Soft deleting milestone', { id });
    const milestone = await Milestone_1.default.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date()
    }, { new: true });
    if (milestone) {
        logger_1.logger.info('Milestone soft deleted', { id, title: milestone.title });
    }
    return milestone;
};
exports.deleteMilestone = deleteMilestone;
const restoreMilestone = async (id) => {
    logger_1.logger.service('MilestoneService', 'Restoring milestone', { id });
    const milestone = await Milestone_1.default.findByIdAndUpdate(id, {
        isDeleted: false,
        deletedAt: undefined
    }, { new: true });
    if (milestone) {
        logger_1.logger.info('Milestone restored', { id, title: milestone.title });
    }
    return milestone;
};
exports.restoreMilestone = restoreMilestone;
const permanentDeleteMilestone = async (id) => {
    logger_1.logger.service('MilestoneService', 'Permanently deleting milestone', { id });
    const milestone = await Milestone_1.default.findByIdAndDelete(id);
    if (milestone) {
        logger_1.logger.warn('Milestone permanently deleted', { id, title: milestone.title });
    }
    return milestone;
};
exports.permanentDeleteMilestone = permanentDeleteMilestone;
const reorderMilestones = async (projectId, milestones) => {
    logger_1.logger.service('MilestoneService', 'Reordering milestones', { projectId, count: milestones.length });
    const updatePromises = milestones.map(({ id, order }) => Milestone_1.default.findByIdAndUpdate(id, { order }, { new: true }));
    await Promise.all(updatePromises);
    logger_1.logger.info('Milestones reordered successfully', { projectId });
    // Return updated milestones for the project
    return await (0, exports.getMilestonesByProject)(projectId);
};
exports.reorderMilestones = reorderMilestones;
const updateMilestoneOrder = async (projectId, order) => {
    logger_1.logger.service('MilestoneService', 'Updating milestone order', { projectId, count: order.length });
    // Update each milestone with its new order index
    const updatePromises = order.map((milestoneId, index) => Milestone_1.default.findByIdAndUpdate(milestoneId, { order: index }, { new: true }));
    await Promise.all(updatePromises);
    logger_1.logger.info('Milestone order updated successfully', { projectId });
    // Return updated milestones for the project
    return await (0, exports.getMilestonesByProject)(projectId);
};
exports.updateMilestoneOrder = updateMilestoneOrder;
//# sourceMappingURL=milestoneService.js.map