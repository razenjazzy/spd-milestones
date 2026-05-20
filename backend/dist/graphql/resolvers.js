"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_1 = require("graphql");
const Project_1 = __importDefault(require("../models/Project"));
const Milestone_1 = __importDefault(require("../models/Milestone"));
// Date scalar type
const dateScalar = new graphql_1.GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    serialize(value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    },
    parseValue(value) {
        return new Date(value);
    },
    parseLiteral(ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});
// Helper function to calculate working days
const calculateWorkingDays = (startDate, endDate) => {
    let count = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
};
exports.resolvers = {
    Date: dateScalar,
    Query: {
        // Get all projects
        projects: async () => {
            try {
                const projects = await Project_1.default.find().sort({ createdAt: -1 });
                return projects;
            }
            catch (error) {
                throw new Error('Failed to fetch projects');
            }
        },
        // Get single project
        project: async (_, { id }) => {
            try {
                const project = await Project_1.default.findById(id);
                if (!project) {
                    throw new Error('Project not found');
                }
                return project;
            }
            catch (error) {
                throw new Error('Failed to fetch project');
            }
        },
        // Get milestones for a project
        milestones: async (_, { projectId }) => {
            try {
                const milestones = await Milestone_1.default.find({ projectId, isDeleted: false }).sort({ order: 1 });
                return milestones;
            }
            catch (error) {
                throw new Error('Failed to fetch milestones');
            }
        },
        // Get single milestone
        milestone: async (_, { id }) => {
            try {
                const milestone = await Milestone_1.default.findById(id);
                if (!milestone) {
                    throw new Error('Milestone not found');
                }
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to fetch milestone');
            }
        },
        // Get Gantt data for a project
        ganttData: async (_, { projectId }) => {
            try {
                const project = await Project_1.default.findById(projectId);
                if (!project) {
                    throw new Error('Project not found');
                }
                const milestones = await Milestone_1.default.find({ projectId, isDeleted: false }).sort({ order: 1 });
                return { project, milestones };
            }
            catch (error) {
                throw new Error('Failed to fetch Gantt data');
            }
        },
        // Get dashboard statistics
        dashboardStats: async () => {
            try {
                const totalProjects = await Project_1.default.countDocuments();
                const totalMilestones = await Milestone_1.default.countDocuments({ isDeleted: false });
                const completedMilestones = await Milestone_1.default.countDocuments({ status: 'completed', isDeleted: false });
                const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
                // Critical projects have overdue milestones
                const now = new Date();
                const overdueMilestones = await Milestone_1.default.find({
                    isDeleted: false,
                    status: { $ne: 'completed' },
                    plannedEnd: { $lt: now }
                });
                const criticalProjectIds = [...new Set(overdueMilestones.map(m => m.projectId.toString()))];
                return {
                    totalProjects,
                    totalMilestones,
                    completionRate,
                    criticalProjects: criticalProjectIds.length,
                };
            }
            catch (error) {
                throw new Error('Failed to fetch dashboard stats');
            }
        },
    },
    Mutation: {
        // Create project
        createProject: async (_, { input }) => {
            try {
                const project = new Project_1.default(input);
                await project.save();
                return project;
            }
            catch (error) {
                throw new Error('Failed to create project');
            }
        },
        // Update project
        updateProject: async (_, { id, input }) => {
            try {
                const project = await Project_1.default.findByIdAndUpdate(id, input, { new: true });
                if (!project) {
                    throw new Error('Project not found');
                }
                return project;
            }
            catch (error) {
                throw new Error('Failed to update project');
            }
        },
        // Delete project
        deleteProject: async (_, { id }) => {
            try {
                const project = await Project_1.default.findByIdAndDelete(id);
                if (!project) {
                    throw new Error('Project not found');
                }
                // Also delete all associated milestones
                await Milestone_1.default.deleteMany({ projectId: id });
                return true;
            }
            catch (error) {
                throw new Error('Failed to delete project');
            }
        },
        // Create milestone
        createMilestone: async (_, { input }) => {
            try {
                // Get the highest order number for this project
                const lastMilestone = await Milestone_1.default.findOne({ projectId: input.projectId })
                    .sort({ order: -1 });
                const order = lastMilestone?.order != null ? lastMilestone.order + 1 : 0;
                const milestone = new Milestone_1.default({
                    ...input,
                    order,
                    status: 'pending',
                });
                await milestone.save();
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to create milestone');
            }
        },
        // Update milestone
        updateMilestone: async (_, { id, input }) => {
            try {
                const milestone = await Milestone_1.default.findByIdAndUpdate(id, input, { new: true });
                if (!milestone) {
                    throw new Error('Milestone not found');
                }
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to update milestone');
            }
        },
        // Soft delete milestone
        deleteMilestone: async (_, { id }) => {
            try {
                const milestone = await Milestone_1.default.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
                if (!milestone) {
                    throw new Error('Milestone not found');
                }
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to delete milestone');
            }
        },
        // Restore milestone
        restoreMilestone: async (_, { id }) => {
            try {
                const milestone = await Milestone_1.default.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
                if (!milestone) {
                    throw new Error('Milestone not found');
                }
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to restore milestone');
            }
        },
        // Complete milestone
        completeMilestone: async (_, { id, input }) => {
            try {
                const milestone = await Milestone_1.default.findByIdAndUpdate(id, {
                    actualStart: input.actualStart,
                    actualEnd: input.actualEnd,
                    status: 'completed',
                }, { new: true });
                if (!milestone) {
                    throw new Error('Milestone not found');
                }
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to complete milestone');
            }
        },
        // Update milestone status
        updateMilestoneStatus: async (_, { id, status }) => {
            try {
                const milestone = await Milestone_1.default.findByIdAndUpdate(id, { status: status.toLowerCase().replace('_', '-') }, { new: true });
                if (!milestone) {
                    throw new Error('Milestone not found');
                }
                return milestone;
            }
            catch (error) {
                throw new Error('Failed to update milestone status');
            }
        },
        // Update milestones order
        updateMilestonesOrder: async (_, { projectId, milestoneIds }) => {
            try {
                const updates = milestoneIds.map((id, index) => Milestone_1.default.findByIdAndUpdate(id, { order: index }, { new: true }));
                const milestones = await Promise.all(updates);
                return milestones.filter(m => m !== null);
            }
            catch (error) {
                throw new Error('Failed to update milestones order');
            }
        },
    },
    // Field resolvers
    Project: {
        milestones: async (parent) => {
            return await Milestone_1.default.find({ projectId: parent._id, isDeleted: false }).sort({ order: 1 });
        },
        stats: async (parent) => {
            const milestones = await Milestone_1.default.find({ projectId: parent._id, isDeleted: false });
            const total = milestones.length;
            const completed = milestones.filter(m => m.status === 'completed').length;
            const inProgress = milestones.filter(m => m.status === 'in-progress').length;
            const now = new Date();
            const overdue = milestones.filter(m => m.status !== 'completed' && new Date(m.plannedEnd) < now).length;
            return {
                totalMilestones: total,
                completedMilestones: completed,
                inProgressMilestones: inProgress,
                overdueMilestones: overdue,
                completionRate: total > 0 ? (completed / total) * 100 : 0,
            };
        },
    },
    Milestone: {
        project: async (parent) => {
            return await Project_1.default.findById(parent.projectId);
        },
        plannedDuration: (parent) => {
            if (parent.plannedStart && parent.plannedEnd) {
                return calculateWorkingDays(new Date(parent.plannedStart), new Date(parent.plannedEnd));
            }
            return null;
        },
        actualDuration: (parent) => {
            if (parent.actualStart && parent.actualEnd) {
                return calculateWorkingDays(new Date(parent.actualStart), new Date(parent.actualEnd));
            }
            return null;
        },
        delay: (parent) => {
            if (parent.actualEnd && parent.plannedEnd) {
                const actual = new Date(parent.actualEnd);
                const planned = new Date(parent.plannedEnd);
                return calculateWorkingDays(planned, actual);
            }
            return null;
        },
    },
};
//# sourceMappingURL=resolvers.js.map